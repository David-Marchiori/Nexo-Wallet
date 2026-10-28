/**
 * Converte uma data para `AAAA-MM-DD` no fuso local.
 * `toISOString()` usa UTC e, no Brasil, depois das 21h devolveria o dia seguinte.
 */
export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Lê `AAAA-MM-DD` como meio-dia local, para não cair no dia anterior por fuso. */
export function parseISODate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00`)
}

/** Mês de uma data ISO: `2026-10-28` → `2026-10`. */
export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7)
}

/** Desloca um mês `AAAA-MM`: `shiftMonth("2026-01", -1)` → `2025-12`. */
export function shiftMonth(month: string, offset: number): string {
  const [year, monthNumber] = month.split("-").map(Number)
  return monthOf(toISODate(new Date(year, monthNumber - 1 + offset, 1)))
}

export function isISODate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(parseISODate(value).getTime())
  )
}
