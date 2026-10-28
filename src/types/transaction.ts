export type TransactionType = "income" | "expense"

export type TransactionFilter = "all" | TransactionType

export type Category =
  | "Renda"
  | "Alimentação"
  | "Moradia"
  | "Assinaturas"
  | "Transporte"
  | "Lazer"
  | "Outros"

export type Transaction = {
  id: string
  title: string
  category: Category
  type: TransactionType
  amount: number
  /** Data no formato ISO `AAAA-MM-DD`, sem horário. */
  date: string
}

export type NewTransaction = Omit<Transaction, "id">

export type TransactionTotals = {
  income: number
  expense: number
  balance: number
}
