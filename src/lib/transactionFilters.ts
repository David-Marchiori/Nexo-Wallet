import { isCategory } from "@/data/categories"
import { monthOf } from "@/lib/date"
import type { Category, Transaction, TransactionFilter } from "@/types/transaction"

export type TransactionFilters = {
  type: TransactionFilter
  /** Mês `AAAA-MM`, ou `null` para todos. */
  month: string | null
  category: Category | null
}

export const typeFilterOptions: { value: TransactionFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "income", label: "Receitas" },
  { value: "expense", label: "Despesas" },
]

// Na URL os filtros ficam em português: /transacoes?tipo=receitas&mes=2026-10&categoria=Moradia
const typeParam: Record<Exclude<TransactionFilter, "all">, string> = { income: "receitas", expense: "despesas" }

export function filtersFromParams(params: URLSearchParams): TransactionFilters {
  const tipo = params.get("tipo")
  const mes = params.get("mes")
  const categoria = params.get("categoria")

  return {
    type: tipo === typeParam.income ? "income" : tipo === typeParam.expense ? "expense" : "all",
    month: mes && /^\d{4}-\d{2}$/.test(mes) ? mes : null,
    category: isCategory(categoria) ? categoria : null,
  }
}

export function filtersToParams(filters: Partial<TransactionFilters>): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.type && filters.type !== "all") params.set("tipo", typeParam[filters.type])
  if (filters.month) params.set("mes", filters.month)
  if (filters.category) params.set("categoria", filters.category)
  return params
}

/** Link para a página de transações já filtrada. */
export function transactionsPath(filters: Partial<TransactionFilters> = {}): string {
  const query = filtersToParams(filters).toString()
  return query ? `/transacoes?${query}` : "/transacoes"
}

/** Aplica filtros e busca (no título, sem diferenciar maiúsculas) e ordena da mais recente para a mais antiga. */
export function applyFilters(transactions: Transaction[], filters: TransactionFilters, search = ""): Transaction[] {
  const query = search.trim().toLowerCase()
  return transactions
    .filter((item) => filters.type === "all" || item.type === filters.type)
    .filter((item) => !filters.month || monthOf(item.date) === filters.month)
    .filter((item) => !filters.category || item.category === filters.category)
    .filter((item) => item.title.toLowerCase().includes(query))
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** Meses que têm lançamentos, do mais recente para o mais antigo. */
export function monthsWithTransactions(transactions: Transaction[]): string[] {
  return [...new Set(transactions.map((item) => monthOf(item.date)))].sort().reverse()
}
