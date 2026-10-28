import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { brl, panel, renderApp, setupAppTests } from "@/test/app"

describe("Página Metas", () => {
  setupAppTests()

  it("mostra o progresso do mês e o histórico comparado à meta", () => {
    renderApp("/metas")

    const thisMonth = panel("Este mês")
    expect(within(thisMonth).getByText(brl(3891.2))).toBeInTheDocument()
    expect(within(thisMonth).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100")

    const history = panel("Histórico")
    expect(within(history).getByText("Meta atingida em 1 dos 5 meses anteriores (comparado à meta atual).")).toBeInTheDocument()
    const rows = within(history).getAllByRole("listitem")
    expect(rows.map((row) => row.firstChild?.textContent)).toEqual([
      "Outubro de 2026",
      "Setembro de 2026",
      "Agosto de 2026",
      "Julho de 2026",
      "Junho de 2026",
      "Maio de 2026",
    ])
    expect(rows[0]).toHaveTextContent("Atingida")
    expect(rows[1]).toHaveTextContent("Atingida")
    expect(rows[2]).toHaveTextContent(`Faltaram ${brl(1000)}`)
  })

  it("altera a meta e atualiza o card do menu lateral", async () => {
    const user = userEvent.setup()
    renderApp("/metas")
    const input = screen.getByLabelText("Valor da meta (R$)")

    expect(input).toHaveValue(2000)
    await user.clear(input)
    await user.type(input, "5000")
    await user.click(screen.getByRole("button", { name: "Salvar meta" }))

    expect(screen.getByRole("status")).toHaveTextContent(`Meta atualizada para ${brl(5000)}.`)
    // R$ 3.891,20 de R$ 5.000 = 78%.
    expect(within(screen.getByRole("complementary")).getByText("78% concluído")).toBeInTheDocument()
    expect(within(panel("Histórico")).getAllByRole("listitem")[0]).toHaveTextContent("Em andamento")
    expect(JSON.parse(localStorage.getItem("nexo-settings")!)).toMatchObject({ monthlySavingsGoal: 5000 })
  })
})
