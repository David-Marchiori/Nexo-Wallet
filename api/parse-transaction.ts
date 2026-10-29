/**
 * Função da Vercel (POST /api/parse-transaction) que transforma uma frase
 * ditada em um rascunho de transação usando o Claude.
 *
 * A chave fica na variável de ambiente ANTHROPIC_API_KEY e nunca chega ao
 * navegador. O arquivo não importa nada do projeto: a Vercel publica cada
 * arquivo de /api isolado e não empacota imports relativos.
 *
 * Entrada: `{ text: string, today: "AAAA-MM-DD" }` (a data local do usuário).
 * Saída: `{ understood, type, amount, category, title, date }`, que o app
 * valida de novo em `src/lib/voiceTransaction.ts` antes de preencher o formulário.
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
const DEFAULT_MODEL = "claude-haiku-5-5"
/** Frases ditadas são curtas; o limite barra textos longos enviados direto à função. */
const MAX_TEXT_LENGTH = 300
const TIMEOUT_MS = 15_000

/** Mesmas categorias de `src/data/categories.ts` (um teste garante que continuam iguais). */
const CATEGORIES = {
  Renda: "salário, freelance, vendas, rendimentos e outras receitas de trabalho. Só para receitas.",
  Alimentação: "mercado, restaurante, delivery, padaria, lanches, café.",
  Moradia: "aluguel, condomínio, luz, água, gás, internet de casa, IPTU, reparos em casa.",
  Assinaturas: "serviços cobrados todo mês: streaming, música, apps, armazenamento na nuvem, academia.",
  Transporte: "Uber, 99, táxi, ônibus, metrô, combustível, estacionamento, pedágio, manutenção do carro.",
  Lazer: "cinema, shows, bares, festas, viagens, passeios, jogos, hobbies.",
  Outros: "saúde, farmácia, roupas, presentes, educação, transferências e o que não se encaixar acima.",
}

const WEEKDAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"]

const SYSTEM_PROMPT = `Você extrai lançamentos financeiros de frases ditadas em português do Brasil para o Nexo, um app de finanças pessoais. O usuário vai revisar o resultado antes de salvar.

Preencha o JSON assim:
- understood: false se a frase não descrever uma receita ou despesa; nesse caso preencha os outros campos com qualquer valor válido.
- type: "expense" para gastos, pagamentos e compras; "income" para dinheiro recebido (salário, freelance, venda, reembolso). Na dúvida, "expense".
- amount: valor em reais, número decimal positivo ("52 e 90" ou "R$ 52,90" → 52.9; "mil e duzentos" → 1200; "1.500" → 1500). null se nenhum valor foi dito.
- category: exatamente uma das categorias abaixo. "Renda" só para receitas. Se nenhuma servir, "Outros".
- title: descrição curta, de 1 a 4 palavras, com inicial maiúscula e sem valor nem data. Escreva marcas e lugares do jeito certo ("iFood", "Uber", "Mercado", "Conta de luz").
- date: AAAA-MM-DD. Sem data na frase, use a de hoje. Resolva datas relativas ("ontem", "sexta passada", "dia 3") com o calendário enviado.

Categorias:
${Object.entries(CATEGORIES)
  .map(([name, description]) => `- ${name}: ${description}`)
  .join("\n")}`

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    understood: { type: "boolean" },
    type: { type: "string", enum: ["expense", "income"] },
    amount: { type: ["number", "null"] },
    category: { type: "string", enum: Object.keys(CATEGORIES) },
    title: { type: "string" },
    date: { type: "string", format: "date" },
  },
  required: ["understood", "type", "amount", "category", "title", "date"],
  additionalProperties: false,
}

type ErrorCode = "invalid_request" | "not_configured" | "ai_failed"

const ERROR_STATUS: Record<ErrorCode, number> = {
  invalid_request: 400,
  not_configured: 503,
  ai_failed: 502,
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  })
}

function fail(code: ErrorCode, detail?: string): Response {
  // Registra só o motivo, nunca a frase: ela contém dados financeiros do usuário.
  if (code !== "invalid_request") console.error(`parse-transaction: ${code}${detail ? ` (${detail})` : ""}`)
  return json({ error: code }, ERROR_STATUS[code])
}

function isISODate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

/** Hoje e os 7 dias anteriores com o dia da semana, para o modelo resolver "ontem" ou "sexta passada" sem calcular. */
function calendarFor(today: string): string {
  const [year, month, day] = today.split("-").map(Number)
  return Array.from({ length: 8 }, (_, offset) => {
    const date = new Date(Date.UTC(year, month - 1, day - offset))
    const iso = date.toISOString().slice(0, 10) // em UTC de propósito: a data já é local
    const weekday = WEEKDAYS[date.getUTCDay()]
    const label = offset === 0 ? `hoje, ${weekday}` : offset === 1 ? `ontem, ${weekday}` : weekday
    return `- ${label}: ${iso}`
  }).join("\n")
}

async function readInput(request: Request): Promise<{ text: string; today: string } | null> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return null
  }
  if (typeof body !== "object" || body === null) return null

  const { text, today } = body as Record<string, unknown>
  if (typeof text !== "string" || !isISODate(today)) return null
  const trimmed = text.trim()
  if (trimmed === "" || trimmed.length > MAX_TEXT_LENGTH) return null
  return { text: trimmed, today }
}

type AnthropicResponse = {
  stop_reason?: string
  content?: { type: string; text?: string }[]
}

export async function POST(request: Request): Promise<Response> {
  const input = await readInput(request)
  if (!input) return fail("invalid_request")

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return fail("not_configured", "ANTHROPIC_API_KEY ausente")

  let response: Response
  try {
    response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: 300,
        // Extração simples: sem raciocínio prévio e com esforço baixo, a resposta volta mais rápido.
        thinking: { type: "disabled" },
        output_config: { effort: "low", format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Calendário:\n${calendarFor(input.today)}\n\nFrase ditada: "${input.text}"`,
          },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    return fail("ai_failed", error instanceof Error ? error.name : "erro de rede")
  }

  if (!response.ok) return fail("ai_failed", `HTTP ${response.status}`)

  try {
    const message = (await response.json()) as AnthropicResponse
    if (message.stop_reason !== "end_turn") return fail("ai_failed", `stop_reason ${message.stop_reason}`)
    const text = message.content?.find((block) => block.type === "text")?.text
    if (!text) return fail("ai_failed", "resposta sem texto")
    return json(JSON.parse(text))
  } catch {
    return fail("ai_failed", "resposta ilegível")
  }
}
