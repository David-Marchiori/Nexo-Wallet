import { toISODate } from "@/lib/date"
import type { Category, Transaction, TransactionType } from "@/types/transaction"

type SampleEntry = {
  title: string
  category: Category
  type: TransactionType
  day: number
  /** Valor em cada um dos últimos 6 meses, do mais antigo ao atual. 0 = sem lançamento. */
  amounts: [number, number, number, number, number, number]
}

const entries: SampleEntry[] = [
  { title: "Salário", category: "Renda", type: "income", day: 5, amounts: [6500, 6500, 6500, 6500, 6500, 6500] },
  { title: "Projeto freelance", category: "Renda", type: "income", day: 20, amounts: [0, 1200, 0, 1850, 0, 900] },
  { title: "Plano de saúde", category: "Outros", type: "expense", day: 3, amounts: [480, 480, 480, 480, 480, 480] },
  { title: "Parcela do notebook", category: "Outros", type: "expense", day: 7, amounts: [0, 0, 0, 900, 900, 900] },
  { title: "Supermercado", category: "Alimentação", type: "expense", day: 8, amounts: [512.3, 468.9, 534.2, 489.6, 545.8, 486.9] },
  { title: "Aluguel", category: "Moradia", type: "expense", day: 10, amounts: [2100, 2100, 2100, 2100, 2100, 2100] },
  { title: "Internet", category: "Moradia", type: "expense", day: 12, amounts: [119.9, 119.9, 119.9, 119.9, 119.9, 119.9] },
  { title: "Spotify", category: "Assinaturas", type: "expense", day: 13, amounts: [21.9, 21.9, 21.9, 21.9, 21.9, 21.9] },
  { title: "Conta de luz", category: "Moradia", type: "expense", day: 15, amounts: [182.4, 175.9, 168.3, 190.1, 201.7, 188.5] },
  { title: "Netflix", category: "Assinaturas", type: "expense", day: 17, amounts: [39.9, 39.9, 39.9, 39.9, 39.9, 39.9] },
  { title: "Viagem de fim de semana", category: "Lazer", type: "expense", day: 18, amounts: [0, 0, 0, 0, 0, 680] },
  { title: "Restaurante", category: "Alimentação", type: "expense", day: 19, amounts: [148, 96.5, 132.9, 174.2, 118.4, 139.9] },
  { title: "Presente de aniversário", category: "Outros", type: "expense", day: 21, amounts: [0, 0, 0, 0, 0, 214.1] },
  { title: "Uber", category: "Transporte", type: "expense", day: 22, amounts: [86.4, 112.3, 74.9, 98.7, 131.2, 92.6] },
  { title: "Cinema", category: "Lazer", type: "expense", day: 24, amounts: [64, 0, 58, 0, 72, 0] },
  { title: "Compras online", category: "Outros", type: "expense", day: 26, amounts: [210, 0, 345.5, 0, 0, 576.3] },
]

/**
 * Transações de exemplo dos últimos 6 meses até `today`, para o dashboard
 * não abrir vazio. Lançamentos com data futura são omitidos.
 */
export function createSampleTransactions(today: Date): Transaction[] {
  const transactions: Transaction[] = []

  entries.forEach((entry, entryIndex) => {
    entry.amounts.forEach((amount, monthIndex) => {
      if (!amount) return
      const monthsAgo = entry.amounts.length - 1 - monthIndex
      const date = new Date(today.getFullYear(), today.getMonth() - monthsAgo, entry.day)
      if (date > today) return

      transactions.push({
        id: `sample-${entryIndex}-${monthIndex}`,
        title: entry.title,
        category: entry.category,
        type: entry.type,
        amount,
        date: toISODate(date),
      })
    })
  })

  return transactions.sort((a, b) => b.date.localeCompare(a.date))
}

/** Reconhece os 5 exemplos fixos de maio/2025 que versões anteriores salvavam no navegador. */
export function isLegacySample(transactions: Transaction[]): boolean {
  const legacyIds = ["1", "2", "3", "4", "5"]
  return (
    transactions.length === legacyIds.length &&
    transactions.every((item) => legacyIds.includes(item.id) && item.date.startsWith("2025-05"))
  )
}
