import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { brl, card, panel, renderApp, savedTransactions, saveTransactions, setupAppTests } from "@/test/app"

function chartMonths() {
  const chart = panel("Fluxo de caixa")
  return ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    .flatMap((month) => within(chart).queryAllByText(month))
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    .map((element) => element.textContent)
}

describe("Layout e navegação", () => {
  setupAppTests()

  it("mostra a data de hoje e a saudação no Dashboard", () => {
    renderApp()

    expect(screen.getByText("QUARTA, 28 DE OUTUBRO")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 1, name: "Olá, Marina." })).toBeInTheDocument()
    expect(document.title).toBe("Nexo")
  })

  it("navega pelo menu lateral e marca a página atual", async () => {
    const user = userEvent.setup()
    renderApp()
    const nav = screen.getByRole("navigation", { name: "Navegação principal" })

    for (const item of ["Dashboard", "Transações", "Relatórios", "Metas", "Configurações"]) {
      expect(within(nav).getByRole("link", { name: item })).toBeInTheDocument()
    }
    expect(within(nav).getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page")

    await user.click(within(nav).getByRole("link", { name: "Transações" }))
    expect(screen.getByRole("heading", { level: 1, name: "Transações" })).toBeInTheDocument()
    expect(within(nav).getByRole("link", { name: "Transações" })).toHaveAttribute("aria-current", "page")
    expect(within(nav).getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current")
    await waitFor(() => expect(document.title).toBe("Transações · Nexo"))

    await user.click(within(nav).getByRole("link", { name: "Relatórios" }))
    expect(screen.getByText("Relatórios em breve")).toBeInTheDocument()
  })

  it("mostra a busca só nas páginas de transações", async () => {
    const user = userEvent.setup()
    renderApp()

    expect(screen.getByPlaceholderText("Buscar transação")).toBeInTheDocument()
    await user.click(screen.getByRole("link", { name: "Metas" }))
    expect(screen.queryByPlaceholderText("Buscar transação")).not.toBeInTheDocument()
  })

  it("leva o card de meta para Metas e o perfil para Configurações", async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole("link", { name: /Meta do mês/ }))
    expect(screen.getByRole("heading", { level: 1, name: "Metas" })).toBeInTheDocument()

    await user.click(screen.getByRole("link", { name: /Marina Alves/ }))
    expect(screen.getByRole("heading", { level: 1, name: "Configurações" })).toBeInTheDocument()
  })

  it("mostra uma página de erro para endereços inexistentes", () => {
    renderApp("/nao-existe")

    expect(screen.getByRole("heading", { level: 1, name: "Página não encontrada" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Voltar ao Dashboard" })).toHaveAttribute("href", "/")
  })

  it("abre e fecha o menu lateral no celular, e fecha ao navegar", async () => {
    const user = userEvent.setup()
    renderApp()
    const closeButtons = () => screen.getAllByRole("button", { name: "Fechar menu" })

    expect(closeButtons()).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: "Abrir menu" }))
    expect(closeButtons()).toHaveLength(2)
    await user.click(closeButtons().find((button) => !button.closest("aside"))!)
    expect(closeButtons()).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: "Abrir menu" }))
    await user.click(closeButtons().find((button) => button.closest("aside"))!)
    expect(closeButtons()).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: "Abrir menu" }))
    await user.click(screen.getByRole("link", { name: "Metas" }))
    expect(closeButtons()).toHaveLength(1)
  })
})

describe("Dashboard", () => {
  setupAppTests()

  it("calcula saldo total e receitas/despesas do mês com a variação", () => {
    renderApp()

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

  it("leva das setas dos cards para as transações filtradas do mês", async () => {
    const user = userEvent.setup()
    renderApp()

    // Card de despesas e gráfico de categorias levam ao mesmo filtro.
    for (const link of screen.getAllByRole("link", { name: "Ver despesas do mês" })) {
      expect(link).toHaveAttribute("href", "/transacoes?tipo=despesas&mes=2026-10")
    }
    await user.click(within(card("Receitas do mês")).getByRole("link", { name: "Ver receitas do mês" }))

    const list = panel("Lançamentos")
    expect(within(list).getByText("Salário")).toBeInTheDocument()
    expect(within(list).queryByText("Salário setembro")).not.toBeInTheDocument()
    expect(within(list).queryByText("Aluguel")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Mês")).toHaveValue("2026-10")
  })

  it("divide as despesas do mês por categoria", () => {
    renderApp()
    const expenses = panel("Despesas por categoria")

    expect(within(expenses).getByText(brl(2608.8))).toBeInTheDocument()
    expect(within(expenses).getByText("Moradia").parentElement).toHaveTextContent("Moradia80%")
    expect(within(expenses).getByText("Alimentação").parentElement).toHaveTextContent("Alimentação19%")
    expect(within(expenses).getByText("Assinaturas").parentElement).toHaveTextContent("Assinaturas1%")
  })

  it("mostra o progresso da meta de economia do mês", () => {
    renderApp()
    const sidebar = screen.getByRole("complementary")

    // Economia de R$ 3.891,20 sobre a meta de R$ 2.000.
    expect(within(sidebar).getByText("100% concluído")).toBeInTheDocument()
    expect(within(sidebar).getByText("Meta atingida. Parabéns!")).toBeInTheDocument()
  })

  it("troca o período do gráfico de fluxo de caixa", async () => {
    const user = userEvent.setup()
    renderApp()
    const chart = panel("Fluxo de caixa")

    expect(chartMonths()).toEqual(["Mai", "Jun", "Jul", "Ago", "Set", "Out"])
    await user.selectOptions(within(chart).getByLabelText("Período do gráfico"), "3")
    expect(chartMonths()).toEqual(["Ago", "Set", "Out"])
    expect(within(chart).getByText("Receitas e despesas dos últimos 3 meses")).toBeInTheDocument()
    await user.selectOptions(within(chart).getByLabelText("Período do gráfico"), "12")
    expect(chartMonths()).toHaveLength(12)
  })

  it("oculta todos os valores, inclusive o total do gráfico de categorias", async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole("button", { name: "Ocultar valores" }))
    expect(screen.getAllByText("R$ ••••••")).toHaveLength(4)

    const toggle = screen.getByRole("button", { name: "Mostrar valores" })
    expect(toggle).toHaveAttribute("aria-pressed", "true")
    await user.click(toggle)
    expect(screen.queryByText("R$ ••••••")).not.toBeInTheDocument()
  })

  it("lista as 6 transações mais recentes e linka para a lista completa", async () => {
    const user = userEvent.setup()
    renderApp()
    const list = panel("Transações recentes")
    const text = list.textContent!.replace(/\s/g, " ")

    const order = ["Spotify", "Aluguel", "Supermercado", "Salário", "Aluguel setembro", "Salário setembro"].map((title) =>
      text.indexOf(title),
    )
    expect(order.every((index) => index >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(within(list).queryByText("Projeto freelance")).not.toBeInTheDocument()
    expect(within(list).getByText("13 de out.")).toBeInTheDocument()

    await user.click(within(list).getByRole("link", { name: "Ver todas as transações" }))
    expect(within(panel("Lançamentos")).getByText("Projeto freelance")).toBeInTheDocument()
  })

  it("filtra por tipo e busca pelo título", async () => {
    const user = userEvent.setup()
    renderApp()
    const list = panel("Transações recentes")

    await user.click(within(list).getByRole("button", { name: "Receitas" }))
    expect(within(list).getByText("Projeto freelance")).toBeInTheDocument()
    expect(within(list).queryByText("Aluguel")).not.toBeInTheDocument()
    await user.click(within(list).getByRole("button", { name: "Todas" }))

    await user.type(screen.getByPlaceholderText("Buscar transação"), "ALU")
    expect(within(list).getByText("Aluguel")).toBeInTheDocument()
    expect(within(list).queryByText("Spotify")).not.toBeInTheDocument()
  })

  it("sem nenhuma transação, mostra os estados vazios", () => {
    saveTransactions([])
    renderApp()

    expect(within(panel("Fluxo de caixa")).getByText("Nenhum lançamento no período.")).toBeInTheDocument()
    expect(within(panel("Despesas por categoria")).getByText("Nenhuma despesa neste mês.")).toBeInTheDocument()
    expect(within(panel("Transações recentes")).getByText("Nenhuma transação encontrada.")).toBeInTheDocument()
    expect(screen.getAllByText("Sem dados do mês anterior")).toHaveLength(2)
    expect(screen.getByText("0% concluído")).toBeInTheDocument()
  })

  it("sem nada salvo, abre com exemplos do mês atual", () => {
    localStorage.clear()
    renderApp()

    expect(within(panel("Transações recentes")).getByText("Compras online")).toBeInTheDocument()
    expect(screen.getByText("68% concluído")).toBeInTheDocument()
  })
})

describe("Criar, editar e excluir transações", () => {
  setupAppTests()

  it("adiciona uma transação e recalcula o mês", async () => {
    const user = userEvent.setup()
    renderApp()

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
    expect(savedTransactions()[0]).toMatchObject({ title: "Cinema", amount: 42.5, category: "Lazer", date: "2026-10-28" })
  })

  it("só oferece categorias compatíveis com o tipo", async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole("button", { name: "Nova transação" }))
    const dialog = screen.getByRole("dialog")
    const category = within(dialog).getByLabelText("Categoria")
    const options = () => within(category).getAllByRole("option").map((option) => option.textContent)

    expect(category).toHaveValue("Alimentação")
    expect(options()).not.toContain("Renda")
    await user.selectOptions(within(dialog).getByLabelText("Tipo"), "income")
    expect(options()).toEqual(["Renda", "Outros"])
    expect(category).toHaveValue("Renda")
  })

  it("fecha o formulário pelo Cancelar, pelo X, pelo Esc e clicando fora", async () => {
    const user = userEvent.setup()
    renderApp()
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
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement!)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("edita uma transação pelo menu ⋯", async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole("button", { name: "Opções de Aluguel" }))
    await user.click(screen.getByRole("menuitem", { name: "Editar" }))

    const dialog = screen.getByRole("dialog", { name: "Editar transação" })
    expect(within(dialog).getByLabelText("Descrição")).toHaveValue("Aluguel")
    expect(within(dialog).getByLabelText("Valor")).toHaveValue(2100)
    expect(within(dialog).getByLabelText("Categoria")).toHaveValue("Moradia")
    expect(within(dialog).getByLabelText("Data")).toHaveValue("2026-10-10")

    await user.clear(within(dialog).getByLabelText("Valor"))
    await user.type(within(dialog).getByLabelText("Valor"), "2200")
    await user.click(within(dialog).getByRole("button", { name: "Salvar alterações" }))

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(within(card("Despesas do mês")).getByText(brl(2708.8))).toBeInTheDocument()
    expect(savedTransactions().find((item) => item.id === "c")).toMatchObject({ amount: 2200, title: "Aluguel" })
    expect(savedTransactions()).toHaveLength(7)
  })

  it("exclui uma transação só depois de confirmar", async () => {
    const user = userEvent.setup()
    renderApp()
    const list = () => panel("Transações recentes")

    await user.click(screen.getByRole("button", { name: "Opções de Spotify" }))
    await user.click(screen.getByRole("menuitem", { name: "Excluir" }))
    const confirm = screen.getByRole("alertdialog", { name: "Excluir transação?" })
    expect(confirm).toHaveTextContent("Spotify")
    expect(within(confirm).getByRole("button", { name: "Cancelar" })).toHaveFocus()

    await user.click(within(confirm).getByRole("button", { name: "Cancelar" }))
    expect(within(list()).getByText("Spotify")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Opções de Spotify" }))
    await user.click(screen.getByRole("menuitem", { name: "Excluir" }))
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Excluir" }))

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    expect(within(list()).queryByText("Spotify")).not.toBeInTheDocument()
    expect(savedTransactions().some((item) => item.id === "d")).toBe(false)
  })

  it("fecha o menu ⋯ com Esc e clicando fora", async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole("button", { name: "Opções de Aluguel" }))
    expect(screen.getByRole("menu")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Opções de Aluguel" })).toHaveAttribute("aria-expanded", "true")
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Opções de Aluguel" }))
    await user.click(screen.getByRole("heading", { level: 1 }))
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })
})
