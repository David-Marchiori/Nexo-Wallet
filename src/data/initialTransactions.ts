import type { Transaction } from "@/types/transaction"

/** Transações de exemplo, usadas quando ainda não há nada salvo. */
export const initialTransactions: Transaction[] = [
  {
    id: "1",
    title: "Salário",
    category: "Renda",
    type: "income",
    amount: 6500,
    date: "2025-05-05",
  },
  {
    id: "2",
    title: "Supermercado",
    category: "Alimentação",
    type: "expense",
    amount: 486.9,
    date: "2025-05-08",
  },
  {
    id: "3",
    title: "Projeto freelance",
    category: "Renda",
    type: "income",
    amount: 1850,
    date: "2025-05-11",
  },
  {
    id: "4",
    title: "Aluguel",
    category: "Moradia",
    type: "expense",
    amount: 2100,
    date: "2025-05-12",
  },
  {
    id: "5",
    title: "Spotify",
    category: "Assinaturas",
    type: "expense",
    amount: 21.9,
    date: "2025-05-13",
  },
]
