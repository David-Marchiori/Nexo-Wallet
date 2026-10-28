import type { Category } from "@/types/transaction"

/** Classe CSS (cor do ícone) de cada categoria. */
export const categoryColorClass: Record<Category, string> = {
  Renda: "category-purple",
  Alimentação: "category-orange",
  Moradia: "category-blue",
  Assinaturas: "category-pink",
  Transporte: "category-green",
  Lazer: "category-yellow",
  Outros: "category-gray",
}

export const categories = Object.keys(categoryColorClass) as Category[]

export function isCategory(value: unknown): value is Category {
  return categories.includes(value as Category)
}
