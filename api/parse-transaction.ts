/**
 * Função da Vercel (POST /api/parse-transaction) que transforma uma frase
 * ditada em um rascunho de transação usando o Gemini (plano gratuito do Google).
 *
 * A chave fica na variável de ambiente GEMINI_API_KEY e nunca chega ao
 * navegador. O arquivo não importa nada do projeto: a Vercel publica cada
 * arquivo de /api isolado e não empacota imports relativos.
 *
 * Entrada: `{ text: string, today: "AAAA-MM-DD" }` (a data local do usuário).
 * Saída: `{ understood, type, amount, category, title, date }`, que o app
 * valida de novo em `src/lib/voiceTransaction.ts` antes de preencher o formulário.
 */

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models"
/** Modelo estável mais rápido do plano gratuito; o raciocínio dele já vem no mínimo. */
const DEFAULT_MODEL = "gemini-3.5-flash-lite"
/** Frases ditadas são curtas; o limite barra textos longos enviados direto à função. */
const MAX_TEXT_LENGTH = 300
const MAX_OUTPUT_TOKENS = 1024
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

type ErrorCode = "invalid_request" | "not_configured" | "rate_limited" | "ai_failed"

const ERROR_STATUS: Record<ErrorCode, number> = {
  invalid_request: 400,
  rate_limited: 429,
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

type GeminiError = {
  error?: { status?: string; message?: string; details?: { reason?: string }[] }
}

/**
 * Resumo do erro devolvido pelo Google para o log (ex.: `HTTP 403 · PERMISSION_DENIED · SERVICE_DISABLED · …`).
 * Traz o motivo da recusa (chave inválida, API desativada, restrição da chave), não a frase do usuário.
 */
async function describeGeminiError(response: Response): Promise<string> {
  const summary = `HTTP ${response.status}`
  try {
    const { error } = (await response.json()) as GeminiError
    if (!error) return summary
    const reasons = (error.details ?? []).map((detail) => detail.reason)
    return [summary, error.status, ...reasons, error.message?.slice(0, 300)].filter(Boolean).join(" · ")
  } catch {
    return summary
  }
}

type GeminiResponse = {
  promptFeedback?: { blockReason?: string }
  candidates?: {
    finishReason?: string
    content?: { parts?: { text?: string; thought?: boolean }[] }
  }[]
}

export async function POST(request: Request): Promise<Response> {
  const input = await readInput(request)
  if (!input) return fail("invalid_request")

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return fail("not_configured", "GEMINI_API_KEY ausente")

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL
  let response: Response
  try {
    response = await fetch(`${GEMINI_URL}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [{ text: `Calendário:\n${calendarFor(input.today)}\n\nFrase ditada: "${input.text}"` }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: OUTPUT_SCHEMA,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    return fail("ai_failed", error instanceof Error ? error.name : "erro de rede")
  }

  // O plano gratuito tem limite de pedidos por minuto e por dia.
  if (response.status === 429) return fail("rate_limited", "limite do plano gratuito")
  if (!response.ok) return fail("ai_failed", await describeGeminiError(response))

  try {
    const result = (await response.json()) as GeminiResponse
    const blocked = result.promptFeedback?.blockReason
    if (blocked) return fail("ai_failed", `bloqueado: ${blocked}`)

    const candidate = result.candidates?.[0]
    if (candidate?.finishReason !== "STOP") return fail("ai_failed", `finishReason ${candidate?.finishReason}`)
    const text = candidate.content?.parts
      ?.filter((part) => !part.thought && typeof part.text === "string")
      .map((part) => part.text)
      .join("")
    if (!text) return fail("ai_failed", "resposta sem texto")
    return json(JSON.parse(text))
  } catch {
    return fail("ai_failed", "resposta ilegível")
  }
}
