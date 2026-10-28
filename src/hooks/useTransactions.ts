import { useCallback, useEffect, useMemo, useState } from "react"
import { createSampleTransactions, isLegacySample } from "@/data/sampleTransactions"
import { createId } from "@/lib/id"
import { loadTransactions, saveTransactions } from "@/lib/storage"
import type { NewTransaction, Transaction, TransactionTotals } from "@/types/transaction"

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = loadTransactions()
    return saved && !isLegacySample(saved) ? saved : createSampleTransactions(new Date())
  })

  useEffect(() => {
    saveTransactions(transactions)
  }, [transactions])

  const totals = useMemo<TransactionTotals>(() => {
    let income = 0
    let expense = 0
    for (const item of transactions) {
      if (item.type === "income") income += item.amount
      else expense += item.amount
    }
    return { income, expense, balance: income - expense }
  }, [transactions])

  const addTransaction = useCallback((data: NewTransaction) => {
    setTransactions((current) => [{ ...data, id: createId() }, ...current])
  }, [])

  const updateTransaction = useCallback((id: string, changes: Partial<NewTransaction>) => {
    setTransactions((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    )
  }, [])

  const removeTransaction = useCallback((id: string) => {
    setTransactions((current) => current.filter((item) => item.id !== id))
  }, [])

  /** Troca a lista inteira (importar backup, restaurar exemplos, apagar tudo). */
  const replaceTransactions = useCallback((next: Transaction[]) => {
    setTransactions(next)
  }, [])

  return { transactions, totals, addTransaction, updateTransaction, removeTransaction, replaceTransactions }
}
