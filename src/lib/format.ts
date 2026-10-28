import { parseISODate } from "@/lib/date"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
})

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "long" })
const dayMonthFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" })
const monthShortFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" })

const percentChangeFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

/** `2025-05-08` → `08 de mai.` */
export function formatShortDate(isoDate: string): string {
  return shortDateFormatter.format(parseISODate(isoDate))
}

/** Data da saudação: `QUARTA, 28 DE OUTUBRO`. */
export function formatGreetingDate(date: Date): string {
  const weekday = weekdayFormatter.format(date).replace("-feira", "")
  return `${weekday}, ${dayMonthFormatter.format(date)}`.toUpperCase()
}

/** Rótulo curto de um mês `AAAA-MM`: `2026-10` → `Out`. */
export function formatMonthShort(month: string): string {
  const label = monthShortFormatter.format(parseISODate(`${month}-01`)).replace(".", "")
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Variação relativa com sinal: `0.082` → `+8,2%`. */
export function formatPercentChange(ratio: number): string {
  return percentChangeFormatter.format(ratio)
}
