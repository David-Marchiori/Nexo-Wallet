import { parseISODate } from "@/lib/date"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

/** `2025-05-08` → `08 de mai.` */
export function formatShortDate(isoDate: string): string {
  return shortDateFormatter.format(parseISODate(isoDate))
}
