import { describe, expect, it } from "vitest"
import { createBackup, parseBackup } from "@/lib/backup"
import type { Transaction } from "@/types/transaction"

const transactions: Transaction[] = [
  { id: "1", title: "Salário", category: "Renda", type: "income", amount: 6500, date: "2026-10-05" },
]
const settings = { name: "Ana Souza", monthlySavingsGoal: 1500 }

describe("backup", () => {
  it("exporta e lê de volta transações e configurações", () => {
    const backup = createBackup(transactions, settings, new Date("2026-10-28T12:00:00Z"))
    expect(backup).toMatchObject({ app: "nexo", version: 1, exportedAt: "2026-10-28T12:00:00.000Z" })

    expect(parseBackup(JSON.stringify(backup))).toEqual({ transactions, ignored: 0, settings })
  })

  it("aceita uma lista simples de transações e conta os itens inválidos", () => {
    const text = JSON.stringify([...transactions, { title: "sem id" }, null])
    expect(parseBackup(text)).toEqual({ transactions, ignored: 2, settings: null })
  })

  it("ignora configurações inválidas sem rejeitar o arquivo", () => {
    const text = JSON.stringify({ app: "nexo", transactions, settings: { name: "", monthlySavingsGoal: -1 } })
    expect(parseBackup(text)?.settings).toBeNull()
  })

  it.each([
    ["texto que não é JSON", "isso não é json"],
    ["JSON de outro app", JSON.stringify({ app: "outro", transactions })],
    ["objeto sem lista", JSON.stringify({ app: "nexo", transactions: "x" })],
  ])("recusa %s", (_, text) => {
    expect(parseBackup(text)).toBeNull()
  })
})
