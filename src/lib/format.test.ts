import { describe, expect, it } from "vitest"
import {
  formatCurrency,
  formatGreetingDate,
  formatMonthShort,
  formatPercentChange,
  formatShortDate,
} from "@/lib/format"

// O Intl usa espaço não separável entre "R$" e o número.
const normalize = (text: string) => text.replace(/\s/g, " ")

describe("formatCurrency", () => {
  it("formata em reais", () => {
    expect(normalize(formatCurrency(2608.8))).toBe("R$ 2.608,80")
    expect(normalize(formatCurrency(0))).toBe("R$ 0,00")
  })
})

describe("formatShortDate", () => {
  it("formata dia e mês abreviado, em minúsculas", () => {
    expect(formatShortDate("2025-05-08")).toBe("08 de mai.")
  })
})

describe("formatGreetingDate", () => {
  it("mostra dia da semana sem '-feira', dia e mês em caixa alta", () => {
    expect(formatGreetingDate(new Date(2026, 9, 28))).toBe("QUARTA, 28 DE OUTUBRO")
    expect(formatGreetingDate(new Date(2026, 9, 31))).toBe("SÁBADO, 31 DE OUTUBRO")
  })
})

describe("formatMonthShort", () => {
  it("abrevia o mês com inicial maiúscula e sem ponto", () => {
    expect(formatMonthShort("2026-05")).toBe("Mai")
    expect(formatMonthShort("2026-10")).toBe("Out")
  })
})

describe("formatPercentChange", () => {
  it("mostra o sinal e uma casa decimal", () => {
    expect(formatPercentChange(0.082)).toBe("+8,2%")
    expect(formatPercentChange(-0.034)).toBe("-3,4%")
    expect(formatPercentChange(0)).toBe("0,0%")
  })
})
