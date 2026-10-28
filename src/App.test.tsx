import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import App from "@/App"
import { toISODate } from "@/lib/date"
import { formatCurrency } from "@/lib/format"
import type { Transaction } from "@/types/transaction"

// O Testing Library normaliza o espaço não separável do Intl para espaço comum.
const brl = (value: number) => formatCurrency(value).replace(/\s/g, " ")

function getTransactionsPanel() {
  return screen.getByRole("heading", { name: "Transações recentes" }).closest("section")!
}

function saveTransactions(transactions: Transaction[]) {
  localStorage.setItem("nexo-transactions", JSON.stringify(transactions))
}

describe("App", () => {
  it("mostra a saudação e os totais das transações de exemplo", () => {
    render(<App />)

    expect(screen.getByRole("heading", { level: 1, name: "Olá, Marina." })).toBeInTheDocument()
    expect(screen.getByText(brl(5741.2))).toBeInTheDocument()
    expect(screen.getByText(brl(8350))).toBeInTheDocument()
    // Despesas aparecem no card e no centro do gráfico de categorias.
    expect(screen.getAllByText(brl(2608.8))).toHaveLength(2)
  })

  it("lista as transações da mais recente para a mais antiga", () => {
    render(<App />)
    const text = getTransactionsPanel().textContent!.replace(/\s/g, " ")

    const order = ["Spotify", "Aluguel", "Projeto freelance", "Supermercado", "Salário"].map((title) => text.indexOf(title))
    expect(order.every((index) => index >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(text).toContain(`+ ${brl(1850)}`)
    expect(text).toContain(`- ${brl(2100)}`)
  })

  it("mostra no máximo 6 transações", () => {
    saveTransactions(
      Array.from({ length: 8 }, (_, index) => ({
        id: String(index),
        title: `Compra ${index + 1}`,
        category: "Outros" as const,
        type: "expense" as const,
        amount: 10,
        date: `2025-05-0${index + 1}`,
      })),
    )
    render(<App />)
    const panel = getTransactionsPanel()

    expect(within(panel).getByText("Compra 8")).toBeInTheDocument()
    expect(within(panel).getByText("Compra 3")).toBeInTheDocument()
    expect(within(panel).queryByText("Compra 2")).not.toBeInTheDocument()
    expect(within(panel).queryByText("Compra 1")).not.toBeInTheDocument()
  })

  it("filtra por receitas e despesas", async () => {
    const user = userEvent.setup()
    render(<App />)
    const panel = getTransactionsPanel()

    await user.click(within(panel).getByRole("button", { name: "Receitas" }))
    expect(within(panel).getByText("Salário")).toBeInTheDocument()
    expect(within(panel).getByText("Projeto freelance")).toBeInTheDocument()
    expect(within(panel).queryByText("Aluguel")).not.toBeInTheDocument()

    await user.click(within(panel).getByRole("button", { name: "Despesas" }))
    expect(within(panel).getByText("Aluguel")).toBeInTheDocument()
    expect(within(panel).getByText("Spotify")).toBeInTheDocument()
    expect(within(panel).queryByText("Salário")).not.toBeInTheDocument()

    await user.click(within(panel).getByRole("button", { name: "Todas" }))
    expect(within(panel).getByText("Salário")).toBeInTheDocument()
    expect(within(panel).getByText("Aluguel")).toBeInTheDocument()
  })

  it("busca pelo título, sem diferenciar maiúsculas", async () => {
    const user = userEvent.setup()
    render(<App />)
    const panel = getTransactionsPanel()
    const search = screen.getByPlaceholderText("Buscar transação")

    await user.type(search, "ALU")
    expect(within(panel).getByText("Aluguel")).toBeInTheDocument()
    expect(within(panel).queryByText("Spotify")).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, "xyz")
    expect(within(panel).getByText("Nenhuma transação encontrada.")).toBeInTheDocument()
  })

  it("oculta e mostra os valores dos cards", async () => {
    const user = userEvent.setup()
    render(<App />)
    const toggle = screen.getByRole("button", { name: "Mostrar ou ocultar saldo" })

    await user.click(toggle)
    expect(screen.getAllByText("R$ ••••••")).toHaveLength(3)
    expect(screen.queryByText(brl(5741.2))).not.toBeInTheDocument()

    await user.click(toggle)
    expect(screen.queryByText("R$ ••••••")).not.toBeInTheDocument()
    expect(screen.getByText(brl(5741.2))).toBeInTheDocument()
  })

  it("adiciona uma transação pelo formulário", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "Nova transação" }))
    const dialog = screen.getByRole("dialog", { name: "Adicionar transação" })

    expect(within(dialog).getByLabelText("Data")).toHaveValue(toISODate(new Date()))
    expect(within(dialog).getByLabelText("Descrição")).toHaveFocus()

    await user.type(within(dialog).getByLabelText("Descrição"), "Cinema")
    await user.selectOptions(within(dialog).getByLabelText("Tipo"), "expense")
    await user.type(within(dialog).getByLabelText("Valor"), "42.50")
    await user.selectOptions(within(dialog).getByLabelText("Categoria"), "Lazer")
    await user.click(within(dialog).getByRole("button", { name: "Adicionar transação" }))

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(within(getTransactionsPanel()).getByText("Cinema")).toBeInTheDocument()
    expect(screen.getAllByText(brl(2651.3))).toHaveLength(2)
    expect(screen.getByText(brl(5698.7))).toBeInTheDocument()

    const saved = JSON.parse(localStorage.getItem("nexo-transactions")!)
    expect(saved[0]).toMatchObject({ title: "Cinema", type: "expense", amount: 42.5, category: "Lazer" })
  })

  it("não salva o formulário sem descrição", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "Nova transação" }))
    const dialog = screen.getByRole("dialog")
    await user.type(within(dialog).getByLabelText("Valor"), "10")
    await user.click(within(dialog).getByRole("button", { name: "Adicionar transação" }))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("fecha o formulário pelo Cancelar, pelo X e clicando fora", async () => {
    const user = userEvent.setup()
    render(<App />)
    const open = () => user.click(screen.getByRole("button", { name: "Nova transação" }))

    await open()
    await user.click(screen.getByRole("button", { name: "Cancelar" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    await open()
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Fechar" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    await open()
    fireEvent.mouseDown(screen.getByRole("dialog"))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement!)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("abre e fecha o menu lateral no celular", async () => {
    const user = userEvent.setup()
    render(<App />)
    const closeButtons = () => screen.getAllByRole("button", { name: "Fechar menu" })

    expect(closeButtons()).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: "Abrir menu" }))
    expect(closeButtons()).toHaveLength(2)

    const overlay = closeButtons().find((button) => !button.closest("aside"))!
    await user.click(overlay)
    expect(closeButtons()).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: "Abrir menu" }))
    await user.click(closeButtons().find((button) => button.closest("aside"))!)
    expect(closeButtons()).toHaveLength(1)
  })

  it("mostra o menu de navegação com o Dashboard ativo", () => {
    render(<App />)
    const nav = screen.getByRole("navigation", { name: "Navegação principal" })

    for (const item of ["Dashboard", "Transações", "Relatórios", "Metas", "Configurações"]) {
      expect(within(nav).getByRole("button", { name: item })).toBeInTheDocument()
    }
  })
})
