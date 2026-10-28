import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createSampleTransactions } from "@/data/sampleTransactions"
import { useTransactions } from "@/hooks/useTransactions"
import { loadTransactions } from "@/lib/storage"
import type { Transaction } from "@/types/transaction"

const TODAY = new Date(2026, 9, 28, 10, 0)

const fixture: Transaction[] = [
  { id: "1", title: "Salário", category: "Renda", type: "income", amount: 6500, date: "2026-10-05" },
  { id: "2", title: "Aluguel", category: "Moradia", type: "expense", amount: 2100, date: "2026-10-10" },
]

describe("useTransactions", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(TODAY)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("começa com exemplos relativos a hoje quando não há nada salvo", () => {
    const { result } = renderHook(() => useTransactions())

    expect(result.current.transactions).toEqual(createSampleTransactions(TODAY))
    expect(loadTransactions()).toEqual(result.current.transactions)
  })

  it("troca os exemplos antigos de maio/2025 pelos novos", () => {
    localStorage.setItem(
      "nexo-transactions",
      JSON.stringify(
        [1, 2, 3, 4, 5].map((n) => ({
          id: n,
          title: `Exemplo ${n}`,
          category: "Outros",
          type: "expense",
          amount: 10,
          date: `2025-05-0${n}`,
        })),
      ),
    )
    const { result } = renderHook(() => useTransactions())

    expect(result.current.transactions).toEqual(createSampleTransactions(TODAY))
  })

  it("respeita uma lista vazia salva (não recria exemplos)", () => {
    localStorage.setItem("nexo-transactions", "[]")
    const { result } = renderHook(() => useTransactions())

    expect(result.current.transactions).toEqual([])
    expect(result.current.totals).toEqual({ income: 0, expense: 0, balance: 0 })
  })

  it("carrega o que estava salvo e calcula os totais", () => {
    localStorage.setItem("nexo-transactions", JSON.stringify(fixture))
    const { result } = renderHook(() => useTransactions())

    expect(result.current.transactions).toEqual(fixture)
    expect(result.current.totals).toEqual({ income: 6500, expense: 2100, balance: 4400 })
  })

  it("adiciona no topo com id novo, recalcula totais e salva", () => {
    localStorage.setItem("nexo-transactions", JSON.stringify(fixture))
    const { result } = renderHook(() => useTransactions())

    act(() => {
      result.current.addTransaction({ title: "Cinema", category: "Lazer", type: "expense", amount: 40, date: "2026-10-20" })
    })

    const [added] = result.current.transactions
    expect(added.title).toBe("Cinema")
    expect(typeof added.id).toBe("string")
    expect(result.current.transactions.filter((t) => t.id === added.id)).toHaveLength(1)
    expect(result.current.totals.expense).toBe(2140)
    expect(loadTransactions()?.[0]).toEqual(added)
  })

  it("edita uma transação", () => {
    localStorage.setItem("nexo-transactions", JSON.stringify(fixture))
    const { result } = renderHook(() => useTransactions())

    act(() => {
      result.current.updateTransaction("1", { amount: 7000 })
    })

    expect(result.current.transactions.find((t) => t.id === "1")?.amount).toBe(7000)
    expect(result.current.totals.income).toBe(7000)
  })

  it("exclui uma transação", () => {
    localStorage.setItem("nexo-transactions", JSON.stringify(fixture))
    const { result } = renderHook(() => useTransactions())

    act(() => {
      result.current.removeTransaction("2")
    })

    expect(result.current.transactions.map((t) => t.id)).toEqual(["1"])
    expect(result.current.totals.expense).toBe(0)
    expect(loadTransactions()).toHaveLength(1)
  })
})
