import type { Category } from "@/types/transaction"

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

export const categories = Object.keys(categoryTone) as Category[]

export function isCategory(value: unknown): value is Category {
  return categories.includes(value as Category)
}
