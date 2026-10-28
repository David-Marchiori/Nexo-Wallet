import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createSampleTransactions } from "@/data/sampleTransactions"
import { panel, renderApp, savedTransactions, setupAppTests, TODAY } from "@/test/app"

describe("Página Configurações", () => {
  setupAppTests()

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("altera o nome do perfil, usado no menu e na saudação", async () => {
    const user = userEvent.setup()
    renderApp("/configuracoes")
    const input = screen.getByLabelText("Nome")

    await user.clear(input)
    await user.type(input, "Ana Souza")
    await user.click(screen.getByRole("button", { name: "Salvar" }))

    expect(screen.getByRole("status")).toHaveTextContent("Perfil atualizado.")
    const sidebar = screen.getByRole("complementary")
    expect(within(sidebar).getByText("Ana Souza")).toBeInTheDocument()
    expect(within(sidebar).getByText("AS")).toBeInTheDocument()

    await user.click(within(sidebar).getByRole("link", { name: "Dashboard" }))
    expect(screen.getByRole("heading", { level: 1, name: "Olá, Ana." })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem("nexo-settings")!)).toMatchObject({ name: "Ana Souza" })
  })

  it("exporta um backup em JSON", async () => {
    const user = userEvent.setup()
    let exported: Blob | undefined
    URL.createObjectURL = vi.fn((blob: Blob) => {
      exported = blob
      return "blob:backup"
    })
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe("nexo-backup-2026-10-28.json")
    })
    renderApp("/configuracoes")

    await user.click(screen.getByRole("button", { name: "Exportar backup" }))

    expect(click).toHaveBeenCalledOnce()
    const backup = JSON.parse(await exported!.text())
    expect(backup).toMatchObject({ app: "nexo", version: 1, settings: { name: "Marina Alves", monthlySavingsGoal: 2000 } })
    expect(backup.transactions).toHaveLength(7)
    expect(screen.getByRole("status")).toHaveTextContent("Backup exportado com 7 transações.")
  })

  it("importa um backup depois de confirmar", async () => {
    const user = userEvent.setup()
    renderApp("/configuracoes")
    const file = new File(
      [
        JSON.stringify({
          app: "nexo",
          version: 1,
          transactions: [{ id: "x", title: "Importada", category: "Lazer", type: "expense", amount: 10, date: "2026-10-01" }, { bad: 1 }],
          settings: { name: "Bia Lima", monthlySavingsGoal: 800 },
        }),
      ],
      "backup.json",
      { type: "application/json" },
    )

    await user.upload(screen.getByLabelText("Arquivo de backup"), file)

    const confirm = await screen.findByRole("alertdialog", { name: "Importar backup?" })
    expect(confirm).toHaveTextContent("Isso substitui 7 transações por 1 transação do arquivo (1 itens inválidos serão ignorados).")
    await user.click(within(confirm).getByRole("button", { name: "Importar" }))

    expect(screen.getByRole("status")).toHaveTextContent("Backup importado: 1 transação.")
    expect(savedTransactions().map((item) => item.title)).toEqual(["Importada"])
    expect(within(screen.getByRole("complementary")).getByText("Bia Lima")).toBeInTheDocument()
  })

  it("avisa quando o arquivo não é um backup", async () => {
    const user = userEvent.setup()
    renderApp("/configuracoes")

    await user.upload(screen.getByLabelText("Arquivo de backup"), new File(["oi"], "nota.json", { type: "application/json" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível ler o arquivo.")
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    expect(savedTransactions()).toHaveLength(7)
  })

  it("apaga todas as transações depois de confirmar", async () => {
    const user = userEvent.setup()
    renderApp("/configuracoes")

    await user.click(screen.getByRole("button", { name: "Apagar todas as transações" }))
    const confirm = screen.getByRole("alertdialog", { name: "Apagar todas as transações?" })
    expect(confirm).toHaveTextContent("Isso apaga 7 transações.")
    await user.click(within(confirm).getByRole("button", { name: "Apagar tudo" }))

    expect(savedTransactions()).toEqual([])
    expect(within(panel("Dados")).getByText("Salvo neste navegador: 0 transações.")).toBeInTheDocument()
  })

  it("restaura os exemplos depois de confirmar", async () => {
    const user = userEvent.setup()
    renderApp("/configuracoes")

    await user.click(screen.getByRole("button", { name: "Restaurar exemplos" }))
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Restaurar" }))

    expect(savedTransactions()).toEqual(createSampleTransactions(TODAY))
    expect(screen.getByRole("status")).toHaveTextContent("Exemplos restaurados.")
  })
})
