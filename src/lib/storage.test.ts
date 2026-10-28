import { afterEach, describe, expect, it, vi } from "vitest"
import { loadTransactions, saveTransactions } from "@/lib/storage"
import type { Transaction } from "@/types/transaction"

const KEY = "nexo-transactions"

describe("loadTransactions", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("retorna null quando não há nada salvo", () => {
    expect(loadTransactions()).toBeNull()
  })

  it("retorna null, sem lançar erro, quando o JSON está corrompido", () => {
    localStorage.setItem(KEY, "{isso não é json")
    expect(() => loadTransactions()).not.toThrow()
    expect(loadTransactions()).toBeNull()
  })

  it("retorna null quando o conteúdo não é uma lista", () => {
    localStorage.setItem(KEY, JSON.stringify({ a: 1 }))
    expect(loadTransactions()).toBeNull()
  })

  it("ignora itens inválidos e converte ids numéricos antigos para string", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { id: 1, title: "Salário", category: "Renda", type: "income", amount: 6500, date: "2025-05-05" },
        { id: 1730000000000, title: "Mercado", category: "Alimentação", type: "expense", amount: 10.5, date: "2025-05-06" },
        { id: 2, title: "Categoria inventada", category: "XYZ", type: "expense", amount: 1, date: "2025-05-06" },
        { id: 3, title: "Valor negativo", category: "Lazer", type: "expense", amount: -5, date: "2025-05-06" },
        { id: 4, title: "Data ruim", category: "Lazer", type: "expense", amount: 5, date: "ontem" },
        { id: 5, title: "Tipo ruim", category: "Lazer", type: "transfer", amount: 5, date: "2025-05-06" },
        { title: "Sem id", category: "Lazer", type: "expense", amount: 5, date: "2025-05-06" },
        null,
        "texto",
      ]),
    )

    const result = loadTransactions()

    expect(result?.map((t) => t.title)).toEqual(["Salário", "Mercado"])
    expect(result?.map((t) => t.id)).toEqual(["1", "1730000000000"])
  })

  it("retorna null, sem lançar erro, quando o localStorage está bloqueado", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError")
    })
    expect(loadTransactions()).toBeNull()
  })
})

describe("saveTransactions", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("salva de forma que loadTransactions lê de volta", () => {
    const transactions: Transaction[] = [
      { id: "abc", title: "Teste", category: "Outros", type: "expense", amount: 9.9, date: "2025-06-01" },
    ]
    saveTransactions(transactions)
    expect(loadTransactions()).toEqual(transactions)
  })

  it("não lança erro quando o armazenamento está cheio", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError")
    })
    expect(() => saveTransactions([])).not.toThrow()
  })
})
