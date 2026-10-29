import { categoriesFor } from "@/data/categories"
import { isISODate, parseISODate, toISODate } from "@/lib/date"
import type { Category, TransactionType } from "@/types/transaction"

/** O que a voz preenche no formulário. Sem valor na frase, `amount` é `null` e o campo fica como estava. */
export type VoiceDraft = {
  type: TransactionType
  amount: number | null
  category: Category
  title: string
  /** `AAAA-MM-DD`. */
  date: string
}

/** Função da Vercel em `api/parse-transaction.ts`. */
export const VOICE_ENDPOINT = "/api/parse-transaction"

const MAX_TITLE_LENGTH = 60

const MESSAGES = {
  notUnderstood: "Não reconheci uma receita ou despesa. Tente algo como “gastei 50 reais no mercado”.",
  notConfigured: "O ditado por voz ainda não foi configurado neste site.",
  invalidRequest: "Não consegui enviar essa frase. Tente uma mais curta.",
  failed: "Não consegui entender agora. Tente de novo ou preencha à mão.",
}

/** Erro com mensagem pronta para mostrar ao usuário. */
export class VoiceDraftError extends Error {}

/**
 * Valida a resposta da função antes de usá-la no formulário, já que nada que vem da rede é confiável.
 * Retorna `null` quando a frase não descreve uma transação.
 */
export function toVoiceDraft(value: unknown, today: string): VoiceDraft | null {
  if (typeof value !== "object" || value === null) return null
  const data = value as Record<string, unknown>
  if (data.understood !== true) return null

  const type: TransactionType = data.type === "income" ? "income" : "expense"
  // O modelo pode mudar maiúsculas de valores fixos; categoria incompatível com o tipo vira "Outros".
  const requested = typeof data.category === "string" ? data.category.toLowerCase() : ""
  const category = categoriesFor(type).find((option) => option.toLowerCase() === requested) ?? "Outros"
  const amount =
    typeof data.amount === "number" && Number.isFinite(data.amount) && data.amount > 0
      ? Math.round(data.amount * 100) / 100
      : null
  const title = typeof data.title === "string" ? data.title.trim().slice(0, MAX_TITLE_LENGTH) : ""
  // `isISODate` aceita "2026-02-30" (vira 2 de março); aqui só passa uma data que existe.
  const date = isISODate(data.date) && toISODate(parseISODate(data.date)) === data.date ? data.date : today

  return { type, amount, category, title, date }
}

/**
 * Envia a frase transcrita para a função, que usa o Claude para identificar tipo, valor,
 * categoria, descrição e data. `today` é a data local (`AAAA-MM-DD`) para resolver "ontem".
 */
export async function interpretSpeech(text: string, today: string, signal?: AbortSignal): Promise<VoiceDraft> {
  let response: Response
  try {
    response = await fetch(VOICE_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, today }),
      signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new VoiceDraftError(MESSAGES.failed)
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const code = (body as { error?: unknown } | null)?.error
    if (code === "not_configured") throw new VoiceDraftError(MESSAGES.notConfigured)
    if (code === "invalid_request") throw new VoiceDraftError(MESSAGES.invalidRequest)
    throw new VoiceDraftError(MESSAGES.failed)
  }

  const draft = toVoiceDraft(body, today)
  if (!draft) throw new VoiceDraftError(MESSAGES.notUnderstood)
  return draft
}
