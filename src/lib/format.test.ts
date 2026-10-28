import { describe, expect, it } from "vitest"
import { formatCurrency, formatShortDate } from "@/lib/format"

// O Intl usa espaço não separável entre "R$" e o número.
const normalize = (text: string) => text.replace(/\s/g, " ")

describe("formatCurrency", () => {
  it("formata em reais", () => {
    expect(normalize(formatCurrency(2608.8))).toBe("R$ 2.608,80")
    expect(normalize(formatCurrency(0))).toBe("R$ 0,00")
  })
})

describe("formatShortDate", () => {
  it("formata dia e mês abreviado", () => {
    expect(formatShortDate("2025-05-08")).toBe("08 de mai.")
  })
})
