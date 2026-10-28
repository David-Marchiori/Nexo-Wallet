import { describe, expect, it } from "vitest"
import { categoriesFor } from "@/data/categories"
import { createSampleTransactions, isLegacySample } from "@/data/sampleTransactions"
import { defaultSettings } from "@/data/defaultSettings"
import { savingsGoalStatus, summarizeMonth } from "@/lib/analytics"
import { loadTransactions, saveTransactions } from "@/lib/storage"

describe("createSampleTransactions", () => {
  const today = new Date(2026, 9, 28, 10, 0)
  const samples = createSampleTransactions(today)

  it("cobre os últimos 6 meses até hoje, sem datas futuras", () => {
    const dates = samples.map((item) => item.date)
    expect(dates.every((date) => date >= "2026-05-01" && date <= "2026-10-28")).toBe(true)
    expect(new Set(dates.map((date) => date.slice(0, 7))).size).toBe(6)
  })

  it("vem do mais recente para o mais antigo, com ids únicos", () => {
    expect([...samples].sort((a, b) => b.date.localeCompare(a.date))).toEqual(samples)
    expect(new Set(samples.map((item) => item.id)).size).toBe(samples.length)
  })

  it("passa pela validação do armazenamento", () => {
    saveTransactions(samples)
    expect(loadTransactions()).toEqual(samples)
  })

  it("usa só categorias compatíveis com o tipo", () => {
    expect(samples.every((item) => categoriesFor(item.type).includes(item.category))).toBe(true)
  })

  it("fecha o mês atual em 68% da meta, como no design", () => {
    const month = summarizeMonth(samples, "2026-10")
    expect(savingsGoalStatus(month, defaultSettings.monthlySavingsGoal).progress).toBe(68)
  })

  it("no começo do mês só inclui o que já aconteceu", () => {
    const early = createSampleTransactions(new Date(2026, 9, 3, 10, 0))
    expect(early.filter((item) => item.date.startsWith("2026-10")).map((item) => item.title)).toEqual(["Plano de saúde"])
  })
})

describe("isLegacySample", () => {
  const legacy = [1, 2, 3, 4, 5].map((n) => ({
    id: String(n),
    title: `Exemplo ${n}`,
    category: "Outros" as const,
    type: "expense" as const,
    amount: 10,
    date: `2025-05-0${n}`,
  }))

  it("reconhece os 5 exemplos antigos de maio/2025", () => {
    expect(isLegacySample(legacy)).toBe(true)
  })

  it("não confunde com dados do usuário", () => {
    expect(isLegacySample([...legacy, { ...legacy[0], id: "abc" }])).toBe(false)
    expect(isLegacySample(legacy.map((item) => ({ ...item, date: "2026-10-01" })))).toBe(false)
  })
})

describe("categoriesFor", () => {
  it("separa categorias de receita e de despesa", () => {
    expect(categoriesFor("income")).toEqual(["Renda", "Outros"])
    expect(categoriesFor("expense")).not.toContain("Renda")
    expect(categoriesFor("expense")).toContain("Outros")
  })
})
