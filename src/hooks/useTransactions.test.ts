import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { initialTransactions } from "@/data/initialTransactions"
import { useTransactions } from "@/hooks/useTransactions"
import { loadTransactions } from "@/lib/storage"

describe("useTransactions", () => {
  it("começa com as transações de exemplo quando não há nada salvo", () => {
    const { result } = renderHook(() => useTransactions())

    expect(result.current.transactions).toEqual(initialTransactions)
    expect(result.current.totals).toEqual({ income: 8350, expense: 2608.8, balance: 5741.2 })
  })

  it("carrega o que estava salvo", () => {
    localStorage.setItem(
      "nexo-transactions",
      JSON.stringify([{ id: "x", title: "Salvo", category: "Lazer", type: "expense", amount: 30, date: "2025-05-01" }]),
    )
    const { result } = renderHook(() => useTransactions())

    expect(result.current.transactions.map((t) => t.title)).toEqual(["Salvo"])
    expect(result.current.totals).toEqual({ income: 0, expense: 30, balance: -30 })
  })

  it("adiciona no topo com id novo, recalcula totais e salva", () => {
    const { result } = renderHook(() => useTransactions())

    act(() => {
      result.current.addTransaction({ title: "Cinema", category: "Lazer", type: "expense", amount: 40, date: "2025-05-20" })
    })

    const [added] = result.current.transactions
    expect(added.title).toBe("Cinema")
    expect(typeof added.id).toBe("string")
    expect(result.current.transactions.filter((t) => t.id === added.id)).toHaveLength(1)
    expect(result.current.totals.expense).toBeCloseTo(2648.8)
    expect(loadTransactions()?.[0]).toEqual(added)
  })

  it("edita uma transação", () => {
    const { result } = renderHook(() => useTransactions())

    act(() => {
      result.current.updateTransaction("1", { amount: 7000 })
    })

    expect(result.current.transactions.find((t) => t.id === "1")?.amount).toBe(7000)
    expect(result.current.totals.income).toBe(8850)
  })

  it("exclui uma transação", () => {
    const { result } = renderHook(() => useTransactions())

    act(() => {
      result.current.removeTransaction("4")
    })

    expect(result.current.transactions.some((t) => t.id === "4")).toBe(false)
    expect(result.current.totals.expense).toBeCloseTo(508.8)
    expect(loadTransactions()).toHaveLength(4)
  })
})
