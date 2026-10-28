import type { Category, TransactionType } from "@/types/transaction"

export type CategoryTone = "purple" | "orange" | "blue" | "pink" | "green" | "yellow" | "gray"

/** Cor do ícone de cada categoria na lista de transações. */
export const categoryTone: Record<Category, CategoryTone> = {
  Renda: "purple",
  Alimentação: "orange",
  Moradia: "blue",
  Assinaturas: "pink",
  Transporte: "green",
  Lazer: "yellow",
  Outros: "gray",
}

/** Tipo de lançamento em que cada categoria pode ser usada. */
const categoryType: Record<Category, TransactionType | "both"> = {
  Renda: "income",
  Alimentação: "expense",
  Moradia: "expense",
  Assinaturas: "expense",
  Transporte: "expense",
  Lazer: "expense",
  Outros: "both",
}

export const categories = Object.keys(categoryTone) as Category[]

export function categoriesFor(type: TransactionType): Category[] {
  return categories.filter((category) => categoryType[category] === type || categoryType[category] === "both")
}

export function isCategory(value: unknown): value is Category {
  return categories.includes(value as Category)
}
