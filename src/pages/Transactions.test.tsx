import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { brl, panel, renderApp, saveTransactions, setupAppTests } from "@/test/app"

const titles = () =>
  ["Salário", "Supermercado", "Aluguel", "Spotify", "Salário setembro", "Aluguel setembro", "Projeto freelance"].filter(
    (title) => within(panel("Lançamentos")).queryByText(title),
  )

describe("Página Transações", () => {
  setupAppTests()

  it("lista todas as transações com o resumo", () => {
    renderApp("/transacoes")
    const list = panel("Lançamentos")

    expect(titles()).toHaveLength(7)
    expect(within(list).getByText("7 transações")).toBeInTheDocument()
    const summary = screen.getByLabelText("Resumo dos lançamentos filtrados")
    expect(summary).toHaveTextContent(`Receitas${brl(13500)}`)
    expect(summary).toHaveTextContent(`Despesas${brl(5108.8)}`)
    expect(summary).toHaveTextContent(`Saldo${brl(8391.2)}`)
  })

  it("lê os filtros da URL", () => {
    renderApp("/transacoes?tipo=despesas&categoria=Moradia")

    expect(titles()).toEqual(["Aluguel", "Aluguel setembro"])
    expect(screen.getByLabelText("Categoria")).toHaveValue("Moradia")
  })

  it("filtra por mês, tipo e categoria, e limpa os filtros", async () => {
    const user = userEvent.setup()
    const router = renderApp("/transacoes")

    expect(within(screen.getByLabelText("Mês")).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Todos os meses",
      "Outubro de 2026",
      "Setembro de 2026",
      "Agosto de 2026",
    ])

    await user.selectOptions(screen.getByLabelText("Mês"), "2026-09")
    expect(titles()).toEqual(["Salário setembro", "Aluguel setembro"])
    expect(router.state.location.search).toBe("?mes=2026-09")

    await user.click(within(panel("Lançamentos")).getByRole("button", { name: "Receitas" }))
    expect(titles()).toEqual(["Salário setembro"])
    expect(router.state.location.search).toBe("?tipo=receitas&mes=2026-09")

    await user.click(screen.getByRole("button", { name: "Limpar filtros" }))
    expect(titles()).toHaveLength(7)
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).not.toBeInTheDocument()
  })

  it("aplica a busca do topo", async () => {
    const user = userEvent.setup()
    renderApp("/transacoes")

    await user.type(screen.getByPlaceholderText("Buscar transação"), "salário")
    expect(titles()).toEqual(["Salário", "Salário setembro"])

    await user.type(screen.getByPlaceholderText("Buscar transação"), "xyz")
    expect(screen.getByText("Nenhuma transação com esses filtros.")).toBeInTheDocument()
  })

  it("edita e exclui direto da lista", async () => {
    const user = userEvent.setup()
    renderApp("/transacoes")

    await user.click(screen.getByRole("button", { name: "Opções de Projeto freelance" }))
    await user.click(screen.getByRole("menuitem", { name: "Editar" }))
    const dialog = screen.getByRole("dialog", { name: "Editar transação" })
    await user.clear(within(dialog).getByLabelText("Descrição"))
    await user.type(within(dialog).getByLabelText("Descrição"), "Freela site")
    await user.click(within(dialog).getByRole("button", { name: "Salvar alterações" }))
    expect(within(panel("Lançamentos")).getByText("Freela site")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Opções de Freela site" }))
    await user.click(screen.getByRole("menuitem", { name: "Excluir" }))
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Excluir" }))
    expect(within(panel("Lançamentos")).queryByText("Freela site")).not.toBeInTheDocument()
    expect(within(panel("Lançamentos")).getByText("6 transações")).toBeInTheDocument()
  })

  it("orienta quando ainda não há transações", () => {
    saveTransactions([])
    renderApp("/transacoes")

    expect(screen.getByText("Nenhuma transação ainda. Use “Nova transação” para começar.")).toBeInTheDocument()
  })
})
