import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import App from "@/App"
import { formatCurrency } from "@/lib/format"
import type { Transaction } from "@/types/transaction"

// Quarta-feira, 28/10/2026. Só o Date é simulado; os timers continuam reais para o user-event.
const TODAY = new Date(2026, 9, 28, 10, 0)

const fixture: Transaction[] = [
  { id: "a", title: "Salário", category: "Renda", type: "income", amount: 6500, date: "2026-10-05" },
  { id: "b", title: "Supermercado", category: "Alimentação", type: "expense", amount: 486.9, date: "2026-10-08" },
  { id: "c", title: "Aluguel", category: "Moradia", type: "expense", amount: 2100, date: "2026-10-10" },
  { id: "d", title: "Spotify", category: "Assinaturas", type: "expense", amount: 21.9, date: "2026-10-13" },
  { id: "e", title: "Salário setembro", category: "Renda", type: "income", amount: 6000, date: "2026-09-05" },
  { id: "f", title: "Aluguel setembro", category: "Moradia", type: "expense", amount: 2500, date: "2026-09-10" },
  { id: "g", title: "Projeto freelance", category: "Renda", type: "income", amount: 1000, date: "2026-08-20" },
]

// O Testing Library normaliza o espaço não separável do Intl para espaço comum.
const brl = (value: number) => formatCurrency(value).replace(/\s/g, " ")

function saveTransactions(transactions: Transaction[]) {
  localStorage.setItem("nexo-transactions", JSON.stringify(transactions))
}

function panel(title: string) {
  return screen.getByRole("heading", { name: title }).closest("article, section") as HTMLElement
}

function card(label: string) {
  return screen.getByText(label).closest("article") as HTMLElement
}

function chartMonths() {
  const chart = panel("Fluxo de caixa")
  return ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    .flatMap((month) => within(chart).queryAllByText(month))
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    .map((element) => element.textContent)
}

describe("App", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(TODAY)
    saveTransactions(fixture)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("mostra a data de hoje na saudação", () => {
    render(<App />)

    expect(screen.getByText("QUARTA, 28 DE OUTUBRO")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 1, name: "Olá, Marina." })).toBeInTheDocument()
  })

  it("calcula saldo total e receitas/despesas do mês com a variação", () => {
    render(<App />)

    const balance = card("Saldo disponível")
    expect(within(balance).getByText(brl(8391.2))).toBeInTheDocument()
    expect(within(balance).getByText("+86,5% este mês")).toBeInTheDocument()

    const income = card("Receitas do mês")
    expect(within(income).getByText(brl(6500))).toBeInTheDocument()
    expect(within(income).getByText("+8,3%")).toBeInTheDocument()

    const expense = card("Despesas do mês")
    expect(within(expense).getByText(brl(2608.8))).toBeInTheDocument()
    expect(within(expense).getByText("+4,4%")).toBeInTheDocument()
  })

  it("divide as despesas do mês por categoria", () => {
    render(<App />)
    const expenses = panel("Despesas por categoria")

    expect(within(expenses).getByText(brl(2608.8))).toBeInTheDocument()
    expect(within(expenses).getByText("Moradia").parentElement).toHaveTextContent("Moradia80%")
    expect(within(expenses).getByText("Alimentação").parentElement).toHaveTextContent("Alimentação19%")
    expect(within(expenses).getByText("Assinaturas").parentElement).toHaveTextContent("Assinaturas1%")
  })

  it("mostra o progresso da meta de economia do mês", () => {
    render(<App />)
    const sidebar = screen.getByRole("complementary")

    // Economia de R$ 3.891,20 sobre a meta de R$ 2.000.
    expect(within(sidebar).getByText("100% concluído")).toBeInTheDocument()
    expect(within(sidebar).getByText("Meta atingida. Parabéns!")).toBeInTheDocument()
  })

  it("troca o período do gráfico de fluxo de caixa", async () => {
    const user = userEvent.setup()
    render(<App />)
    const chart = panel("Fluxo de caixa")

    expect(chartMonths()).toEqual(["Mai", "Jun", "Jul", "Ago", "Set", "Out"])
    expect(within(chart).getByText("Receitas e despesas dos últimos 6 meses")).toBeInTheDocument()

    await user.selectOptions(within(chart).getByLabelText("Período do gráfico"), "3")
    expect(chartMonths()).toEqual(["Ago", "Set", "Out"])
    expect(within(chart).getByText("Receitas e despesas dos últimos 3 meses")).toBeInTheDocument()

    await user.selectOptions(within(chart).getByLabelText("Período do gráfico"), "12")
    expect(chartMonths()).toHaveLength(12)
  })

  it("oculta todos os valores, inclusive o total do gráfico de categorias", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "Ocultar valores" }))
    expect(screen.getAllByText("R$ ••••••")).toHaveLength(4)
    expect(screen.queryByText(brl(2608.8))).not.toBeInTheDocument()

    const toggle = screen.getByRole("button", { name: "Mostrar valores" })
    expect(toggle).toHaveAttribute("aria-pressed", "true")
    await user.click(toggle)
    expect(screen.queryByText("R$ ••••••")).not.toBeInTheDocument()
  })

  it("lista as 6 transações mais recentes, da mais nova para a mais antiga", () => {
    render(<App />)
    const list = panel("Transações recentes")
    const text = list.textContent!.replace(/\s/g, " ")

    const order = ["Spotify", "Aluguel", "Supermercado", "Salário", "Aluguel setembro", "Salário setembro"].map((title) =>
      text.indexOf(title),
    )
    expect(order.every((index) => index >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(within(list).queryByText("Projeto freelance")).not.toBeInTheDocument()
    expect(text).toContain(`+ ${brl(6500)}`)
    expect(text).toContain(`- ${brl(2100)}`)
    expect(within(list).getByText("13 de out.")).toBeInTheDocument()
  })

  it("filtra por receitas e despesas", async () => {
    const user = userEvent.setup()
    render(<App />)
    const list = panel("Transações recentes")

    await user.click(within(list).getByRole("button", { name: "Receitas" }))
    expect(within(list).getByText("Salário")).toBeInTheDocument()
    expect(within(list).getByText("Projeto freelance")).toBeInTheDocument()
    expect(within(list).queryByText("Aluguel")).not.toBeInTheDocument()

    await user.click(within(list).getByRole("button", { name: "Despesas" }))
    expect(within(list).getByText("Aluguel")).toBeInTheDocument()
    expect(within(list).queryByText("Salário")).not.toBeInTheDocument()

    await user.click(within(list).getByRole("button", { name: "Todas" }))
    expect(within(list).getByText("Salário")).toBeInTheDocument()
  })

  it("busca pelo título, sem diferenciar maiúsculas", async () => {
    const user = userEvent.setup()
    render(<App />)
    const list = panel("Transações recentes")
    const search = screen.getByPlaceholderText("Buscar transação")

    await user.type(search, "ALU")
    expect(within(list).getByText("Aluguel")).toBeInTheDocument()
    expect(within(list).getByText("Aluguel setembro")).toBeInTheDocument()
    expect(within(list).queryByText("Spotify")).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, "xyz")
    expect(within(list).getByText("Nenhuma transação encontrada.")).toBeInTheDocument()
  })

  it("adiciona uma transação e recalcula o mês", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "Nova transação" }))
    const dialog = screen.getByRole("dialog", { name: "Adicionar transação" })

    expect(within(dialog).getByLabelText("Data")).toHaveValue("2026-10-28")
    expect(within(dialog).getByLabelText("Descrição")).toHaveFocus()

    await user.type(within(dialog).getByLabelText("Descrição"), "Cinema")
    await user.type(within(dialog).getByLabelText("Valor"), "42.50")
    await user.selectOptions(within(dialog).getByLabelText("Categoria"), "Lazer")
    await user.click(within(dialog).getByRole("button", { name: "Adicionar transação" }))

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(within(panel("Transações recentes")).getByText("Cinema")).toBeInTheDocument()
    expect(within(card("Despesas do mês")).getByText(brl(2651.3))).toBeInTheDocument()
    expect(within(card("Saldo disponível")).getByText(brl(8348.7))).toBeInTheDocument()

    const saved = JSON.parse(localStorage.getItem("nexo-transactions")!)
    expect(saved[0]).toMatchObject({ title: "Cinema", type: "expense", amount: 42.5, category: "Lazer", date: "2026-10-28" })
  })

  it("só oferece categorias compatíveis com o tipo", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "Nova transação" }))
    const dialog = screen.getByRole("dialog")
    const category = within(dialog).getByLabelText("Categoria")
    const options = () => within(category).getAllByRole("option").map((option) => option.textContent)

    expect(category).toHaveValue("Alimentação")
    expect(options()).not.toContain("Renda")

    await user.selectOptions(within(dialog).getByLabelText("Tipo"), "income")
    expect(options()).toEqual(["Renda", "Outros"])
    expect(category).toHaveValue("Renda")

    await user.selectOptions(category, "Outros")
    await user.selectOptions(within(dialog).getByLabelText("Tipo"), "expense")
    expect(category).toHaveValue("Outros")
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

  it("fecha o formulário pelo Cancelar, pelo X, pelo Esc e clicando fora", async () => {
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
    await user.keyboard("{Escape}")
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

    await user.click(closeButtons().find((button) => !button.closest("aside"))!)
    expect(closeButtons()).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: "Abrir menu" }))
    await user.click(closeButtons().find((button) => button.closest("aside"))!)
    expect(closeButtons()).toHaveLength(1)
  })

  it("mostra o menu de navegação", () => {
    render(<App />)
    const nav = screen.getByRole("navigation", { name: "Navegação principal" })

    for (const item of ["Dashboard", "Transações", "Relatórios", "Metas", "Configurações"]) {
      expect(within(nav).getByRole("button", { name: item })).toBeInTheDocument()
    }
  })

  it("sem nenhuma transação, mostra os estados vazios", () => {
    saveTransactions([])
    render(<App />)

    expect(within(panel("Fluxo de caixa")).getByText("Nenhum lançamento no período.")).toBeInTheDocument()
    expect(within(panel("Despesas por categoria")).getByText("Nenhuma despesa neste mês.")).toBeInTheDocument()
    expect(within(panel("Transações recentes")).getByText("Nenhuma transação encontrada.")).toBeInTheDocument()
    expect(screen.getAllByText("Sem dados do mês anterior")).toHaveLength(2)
    expect(within(card("Saldo disponível")).getByText(`+${brl(0)} este mês`)).toBeInTheDocument()
    expect(screen.getByText("0% concluído")).toBeInTheDocument()
  })

  it("sem nada salvo, abre com exemplos do mês atual", () => {
    localStorage.clear()
    render(<App />)

    expect(within(panel("Transações recentes")).getByText("Compras online")).toBeInTheDocument()
    expect(screen.getByText("68% concluído")).toBeInTheDocument()
    expect(screen.getByText("Você está no caminho certo.")).toBeInTheDocument()
  })
})
