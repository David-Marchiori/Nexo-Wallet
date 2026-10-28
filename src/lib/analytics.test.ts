import { describe, expect, it } from "vitest"
import {
  balanceBefore,
  expenseShares,
  monthlyCashflow,
  percentChange,
  savingsGoalStatus,
  summarizeMonth,
} from "@/lib/analytics"
import type { Category, Transaction, TransactionType } from "@/types/transaction"

let nextId = 0
function tx(date: string, type: TransactionType, amount: number, category: Category = "Outros"): Transaction {
  return { id: String(nextId++), title: `t${nextId}`, category, type, amount, date }
}

const transactions = [
  tx("2026-08-20", "income", 1000, "Renda"),
  tx("2026-09-05", "income", 6000, "Renda"),
  tx("2026-09-10", "expense", 2500, "Moradia"),
  tx("2026-10-05", "income", 6500, "Renda"),
  tx("2026-10-08", "expense", 486.9, "Alimentação"),
  tx("2026-10-10", "expense", 2100, "Moradia"),
  tx("2026-10-13", "expense", 21.9, "Assinaturas"),
]

describe("summarizeMonth", () => {
  it("soma receitas e despesas só do mês pedido", () => {
    expect(summarizeMonth(transactions, "2026-10")).toEqual({ income: 6500, expense: 2608.8 })
    expect(summarizeMonth(transactions, "2026-09")).toEqual({ income: 6000, expense: 2500 })
    expect(summarizeMonth(transactions, "2026-07")).toEqual({ income: 0, expense: 0 })
  })
})

describe("balanceBefore", () => {
  it("acumula o saldo de tudo antes do mês", () => {
    expect(balanceBefore(transactions, "2026-10")).toBe(4500)
    expect(balanceBefore(transactions, "2026-08")).toBe(0)
  })
})

describe("percentChange", () => {
  it("calcula a variação relativa", () => {
    expect(percentChange(6500, 6000)).toBeCloseTo(0.0833, 4)
    expect(percentChange(50, 100)).toBe(-0.5)
  })

  it("usa o valor absoluto da base quando ela é negativa", () => {
    expect(percentChange(-500, -1000)).toBe(0.5)
  })

  it("retorna null sem base de comparação", () => {
    expect(percentChange(100, 0)).toBeNull()
  })
})

describe("monthlyCashflow", () => {
  it("retorna os N meses terminando no mês pedido, inclusive meses vazios", () => {
    expect(monthlyCashflow(transactions, "2026-10", 3)).toEqual([
      { month: "2026-08", income: 1000, expense: 0 },
      { month: "2026-09", income: 6000, expense: 2500 },
      { month: "2026-10", income: 6500, expense: 2608.8 },
    ])
  })

  it("atravessa a virada de ano", () => {
    expect(monthlyCashflow([], "2026-02", 3).map((point) => point.month)).toEqual(["2025-12", "2026-01", "2026-02"])
  })
})

describe("expenseShares", () => {
  it("divide as despesas do mês por categoria, com percentuais que somam 100", () => {
    expect(expenseShares(transactions, "2026-10")).toEqual([
      { name: "Moradia", amount: 2100, percent: 80 },
      { name: "Alimentação", amount: 486.9, percent: 19 },
      { name: "Assinaturas", amount: 21.9, percent: 1 },
    ])
  })

  it("junta as menores em Outros quando há mais de 4 categorias, sempre por último", () => {
    const shares = expenseShares(
      [
        tx("2026-10-01", "expense", 400, "Moradia"),
        tx("2026-10-01", "expense", 300, "Alimentação"),
        tx("2026-10-01", "expense", 200, "Lazer"),
        tx("2026-10-01", "expense", 60, "Transporte"),
        tx("2026-10-01", "expense", 40, "Assinaturas"),
      ],
      "2026-10",
    )
    expect(shares.map((share) => [share.name, share.amount, share.percent])).toEqual([
      ["Moradia", 400, 40],
      ["Alimentação", 300, 30],
      ["Lazer", 200, 20],
      ["Outros", 100, 10],
    ])
  })

  it("soma a categoria Outros com as que sobram", () => {
    const shares = expenseShares(
      [
        tx("2026-10-01", "expense", 900, "Outros"),
        tx("2026-10-01", "expense", 50, "Moradia"),
        tx("2026-10-01", "expense", 30, "Lazer"),
        tx("2026-10-01", "expense", 15, "Transporte"),
        tx("2026-10-01", "expense", 5, "Assinaturas"),
      ],
      "2026-10",
    )
    expect(shares.map((share) => share.name)).toEqual(["Moradia", "Lazer", "Transporte", "Outros"])
    expect(shares.at(-1)?.amount).toBe(905)
    expect(shares.reduce((sum, share) => sum + share.percent, 0)).toBe(100)
  })

  it("ignora receitas e retorna vazio sem despesas", () => {
    expect(expenseShares(transactions, "2026-08")).toEqual([])
  })
})

describe("savingsGoalStatus", () => {
  it("calcula o progresso da economia do mês", () => {
    expect(savingsGoalStatus({ income: 7400, expense: 6040 }, 2000)).toEqual({
      progress: 68,
      description: "Você está no caminho certo.",
    })
  })

  it("limita a 100% e comemora quando a meta é batida", () => {
    expect(savingsGoalStatus({ income: 9000, expense: 1000 }, 2000)).toEqual({
      progress: 100,
      description: "Meta atingida. Parabéns!",
    })
  })

  it("fica em 0% quando as despesas passam as receitas", () => {
    expect(savingsGoalStatus({ income: 1000, expense: 1500 }, 2000)).toEqual({
      progress: 0,
      description: "As despesas passaram as receitas.",
    })
  })

  it("incentiva quando o progresso ainda é baixo", () => {
    expect(savingsGoalStatus({ income: 500, expense: 0 }, 2000).description).toBe("Ainda dá para chegar lá.")
  })
})
