import { isCategory } from "@/data/categories"
import { isISODate } from "@/lib/date"
import type { Settings } from "@/types/settings"
import type { Transaction } from "@/types/transaction"

const TRANSACTIONS_KEY = "nexo-transactions"
const SETTINGS_KEY = "nexo-settings"

/** Lê e interpreta um JSON salvo; `null` se não existir, estiver ilegível ou o acesso for bloqueado. */
function read(key: string): unknown {
  try {
    const saved = localStorage.getItem(key)
    return saved === null ? null : JSON.parse(saved)
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Armazenamento cheio ou bloqueado (ex.: modo privado): o app segue só em memória.
  }
}

/**
 * Lê as transações salvas. Retorna `null` quando não há nada salvo ou o
 * conteúdo é ilegível; itens inválidos dentro de uma lista válida são ignorados.
 */
export function loadTransactions(): Transaction[] | null {
  return parseTransactions(read(TRANSACTIONS_KEY))
}

export function saveTransactions(transactions: Transaction[]): void {
  write(TRANSACTIONS_KEY, transactions)
}

export function loadSettings(): Settings | null {
  return parseSettings(read(SETTINGS_KEY))
}

export function saveSettings(settings: Settings): void {
  write(SETTINGS_KEY, settings)
}

/** Valida uma lista vinda de fora (armazenamento ou backup); `null` se não for uma lista. */
export function parseTransactions(value: unknown): Transaction[] | null {
  if (!Array.isArray(value)) return null
  return value.flatMap((item) => {
    const transaction = toTransaction(item)
    return transaction ? [transaction] : []
  })
}

export function parseSettings(value: unknown): Settings | null {
  if (typeof value !== "object" || value === null) return null
  const { name, monthlySavingsGoal } = value as Record<string, unknown>

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof monthlySavingsGoal !== "number" ||
    !Number.isFinite(monthlySavingsGoal) ||
    monthlySavingsGoal < 0
  ) {
    return null
  }

  return { name: name.trim(), monthlySavingsGoal }
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
