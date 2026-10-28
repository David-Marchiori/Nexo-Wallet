import { render, screen } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { afterEach, beforeEach, vi } from "vitest"
import { formatCurrency } from "@/lib/format"
import { routes } from "@/routes"
import type { Transaction } from "@/types/transaction"

/** Quarta-feira, 28/10/2026, 10h. */
export const TODAY = new Date(2026, 9, 28, 10, 0)

export const fixture: Transaction[] = [
  { id: "a", title: "Salário", category: "Renda", type: "income", amount: 6500, date: "2026-10-05" },
  { id: "b", title: "Supermercado", category: "Alimentação", type: "expense", amount: 486.9, date: "2026-10-08" },
  { id: "c", title: "Aluguel", category: "Moradia", type: "expense", amount: 2100, date: "2026-10-10" },
  { id: "d", title: "Spotify", category: "Assinaturas", type: "expense", amount: 21.9, date: "2026-10-13" },
  { id: "e", title: "Salário setembro", category: "Renda", type: "income", amount: 6000, date: "2026-09-05" },
  { id: "f", title: "Aluguel setembro", category: "Moradia", type: "expense", amount: 2500, date: "2026-09-10" },
  { id: "g", title: "Projeto freelance", category: "Renda", type: "income", amount: 1000, date: "2026-08-20" },
]

/** Valor em reais como o Testing Library enxerga (espaço não separável vira espaço comum). */
export const brl = (value: number) => formatCurrency(value).replace(/\s/g, " ")

export function saveTransactions(transactions: Transaction[]) {
  localStorage.setItem("nexo-transactions", JSON.stringify(transactions))
}

export function savedTransactions(): Transaction[] {
  return JSON.parse(localStorage.getItem("nexo-transactions")!)
}

/**
 * Fixa a data em TODAY e começa cada teste com `fixture` salvo.
 * Só o Date é simulado; os timers continuam reais para o user-event funcionar.
 */
export function setupAppTests() {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(TODAY)
    saveTransactions(fixture)
  })

  afterEach(() => {
    vi.useRealTimers()
  })
}

/** Monta o app completo (rotas, layout e dados) já na URL pedida. */
export function renderApp(path = "/") {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

/** Painel (article/section) pelo título do seu cabeçalho. */
export function panel(title: string): HTMLElement {
  return screen.getByRole("heading", { name: title }).closest("article, section") as HTMLElement
}

/** Card do dashboard pelo seu rótulo (ex.: "Receitas do mês"). */
export function card(label: string): HTMLElement {
  return screen.getByText(label).closest("article") as HTMLElement
}
