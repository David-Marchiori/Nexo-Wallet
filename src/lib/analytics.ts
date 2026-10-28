import { monthOf, shiftMonth } from "@/lib/date"
import type { Category, Transaction } from "@/types/transaction"

export type Summary = {
  income: number
  expense: number
}

export function summarize(transactions: Transaction[]): Summary {
  let income = 0
  let expense = 0
  for (const item of transactions) {
    if (item.type === "income") income += item.amount
    else expense += item.amount
  }
  return { income, expense }
}

/** Receitas e despesas de um mês `AAAA-MM`. */
export function summarizeMonth(transactions: Transaction[], month: string): Summary {
  return summarize(transactions.filter((item) => monthOf(item.date) === month))
}

/** Saldo acumulado de tudo que veio antes do mês `AAAA-MM`. */
export function balanceBefore(transactions: Transaction[], month: string): number {
  const { income, expense } = summarize(transactions.filter((item) => monthOf(item.date) < month))
  return income - expense
}

/** Variação relativa entre dois valores; `null` quando não há base de comparação. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return (current - previous) / Math.abs(previous)
}

export type CashflowMonth = Summary & { month: string }

/** Receitas e despesas de cada um dos `count` meses que terminam em `lastMonth`. */
export function monthlyCashflow(transactions: Transaction[], lastMonth: string, count: number): CashflowMonth[] {
  return Array.from({ length: count }, (_, index) => {
    const month = shiftMonth(lastMonth, index - count + 1)
    return { month, ...summarizeMonth(transactions, month) }
  })
}

export type ExpenseShare = {
  name: Category
  amount: number
  /** Inteiro de 0 a 100; a soma de todas as fatias é exatamente 100. */
  percent: number
}

const OTHERS: Category = "Outros"

/**
 * Despesas do mês por categoria, da maior para a menor. Se houver mais
 * categorias que `maxSlices`, as menores são somadas em "Outros" (sempre por último).
 */
export function expenseShares(transactions: Transaction[], month: string, maxSlices = 4): ExpenseShare[] {
  const byCategory = new Map<Category, number>()
  for (const item of transactions) {
    if (item.type !== "expense" || monthOf(item.date) !== month) continue
    byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + item.amount)
  }

  const total = [...byCategory.values()].reduce((sum, amount) => sum + amount, 0)
  if (total === 0) return []

  const ranked = [...byCategory].filter(([name]) => name !== OTHERS).sort((a, b) => b[1] - a[1])
  let others = byCategory.get(OTHERS) ?? 0
  const namedSlots = others > 0 || ranked.length > maxSlices ? maxSlices - 1 : maxSlices
  for (const [, amount] of ranked.slice(namedSlots)) others += amount

  const slices = ranked.slice(0, namedSlots).map(([name, amount]) => ({ name, amount }))
  if (others > 0) slices.push({ name: OTHERS, amount: others })

  const percents = roundToHundred(slices.map((slice) => (slice.amount / total) * 100))
  return slices.map((slice, index) => ({ ...slice, percent: percents[index] }))
}

/** Arredonda porcentagens para inteiros que somam 100 (método dos maiores restos). */
function roundToHundred(values: number[]): number[] {
  const result = values.map(Math.floor)
  let missing = 100 - result.reduce((sum, value) => sum + value, 0)
  const byRemainder = values.map((value, index) => ({ index, remainder: value - result[index] }))
  byRemainder.sort((a, b) => b.remainder - a.remainder)
  for (const { index } of byRemainder) {
    if (missing <= 0) break
    result[index] += 1
    missing -= 1
  }
  return result
}

export type GoalStatus = {
  /** De 0 a 100. */
  progress: number
  description: string
}

/** Progresso da meta de economia do mês (receitas − despesas). */
export function savingsGoalStatus({ income, expense }: Summary, goal: number): GoalStatus {
  const saved = income - expense
  const progress = goal > 0 ? Math.min(100, Math.max(0, Math.round((saved / goal) * 100))) : 0

  let description = "Ainda dá para chegar lá."
  if (saved < 0) description = "As despesas passaram as receitas."
  else if (progress >= 100) description = "Meta atingida. Parabéns!"
  else if (progress >= 50) description = "Você está no caminho certo."

  return { progress, description }
}
