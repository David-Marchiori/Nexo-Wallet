import { isCategory } from "@/data/categories"
import { isISODate } from "@/lib/date"
import type { Transaction } from "@/types/transaction"

const STORAGE_KEY = "nexo-transactions"

/**
 * Lê as transações salvas. Retorna `null` quando não há nada salvo ou o
 * conteúdo é ilegível; itens inválidos dentro de uma lista válida são ignorados.
 */
export function loadTransactions(): Transaction[] | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === null) return null

    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return null

    return parsed.flatMap((item) => {
      const transaction = toTransaction(item)
      return transaction ? [transaction] : []
    })
  } catch {
    return null
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  } catch {
    // Armazenamento cheio ou bloqueado (ex.: modo privado): o app segue só em memória.
  }
}

function toTransaction(value: unknown): Transaction | null {
  if (typeof value !== "object" || value === null) return null
  const { id, title, category, type, amount, date } = value as Record<string, unknown>

  // Versões anteriores salvavam o id como número (Date.now()).
  const isValidId = typeof id === "string" || typeof id === "number"
  const isValidAmount = typeof amount === "number" && Number.isFinite(amount) && amount > 0

  if (
    !isValidId ||
    typeof title !== "string" ||
    !isCategory(category) ||
    (type !== "income" && type !== "expense") ||
    !isValidAmount ||
    !isISODate(date)
  ) {
    return null
  }

  return { id: String(id), title, category, type, amount, date }
}
