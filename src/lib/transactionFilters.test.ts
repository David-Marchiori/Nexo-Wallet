import { describe, expect, it } from "vitest"
import {
  applyFilters,
  filtersFromParams,
  filtersToParams,
  monthsWithTransactions,
  transactionsPath,
} from "@/lib/transactionFilters"
import type { Transaction } from "@/types/transaction"

const transactions: Transaction[] = [
  { id: "1", title: "Salário", category: "Renda", type: "income", amount: 6500, date: "2026-10-05" },
  { id: "2", title: "Aluguel", category: "Moradia", type: "expense", amount: 2100, date: "2026-10-10" },
  { id: "3", title: "Aluguel set", category: "Moradia", type: "expense", amount: 2100, date: "2026-09-10" },
  { id: "4", title: "Mercado", category: "Alimentação", type: "expense", amount: 400, date: "2026-09-08" },
]

describe("filtros na URL", () => {
  it("lê os parâmetros em português", () => {
    expect(filtersFromParams(new URLSearchParams("tipo=receitas&mes=2026-10&categoria=Renda"))).toEqual({
      type: "income",
      month: "2026-10",
      category: "Renda",
    })
  })

  it("ignora valores inválidos", () => {
    expect(filtersFromParams(new URLSearchParams("tipo=xyz&mes=outubro&categoria=Nada"))).toEqual({
      type: "all",
      month: null,
      category: null,
    })
  })

  it("monta a URL só com os filtros ativos", () => {
    expect(transactionsPath()).toBe("/transacoes")
    expect(transactionsPath({ type: "expense", month: "2026-10" })).toBe("/transacoes?tipo=despesas&mes=2026-10")
    expect(filtersToParams({ type: "all", month: null, category: "Moradia" }).toString()).toBe("categoria=Moradia")
  })
})

describe("applyFilters", () => {
  it("combina tipo, mês, categoria e busca, do mais recente para o mais antigo", () => {
    const titles = (list: Transaction[]) => list.map((item) => item.title)
    const all = { type: "all", month: null, category: null } as const

    expect(titles(applyFilters(transactions, all))).toEqual(["Aluguel", "Salário", "Aluguel set", "Mercado"])
    expect(titles(applyFilters(transactions, { ...all, type: "expense", month: "2026-09" }))).toEqual([
      "Aluguel set",
      "Mercado",
    ])
    expect(titles(applyFilters(transactions, { ...all, category: "Moradia" }, " ALU "))).toEqual(["Aluguel", "Aluguel set"])
  })
})

describe("monthsWithTransactions", () => {
  it("lista os meses sem repetir, do mais recente para o mais antigo", () => {
    expect(monthsWithTransactions(transactions)).toEqual(["2026-10", "2026-09"])
  })
})
