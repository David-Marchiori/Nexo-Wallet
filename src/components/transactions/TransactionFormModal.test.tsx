import { act, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fixture, renderApp, savedTransactions, setupAppTests } from "@/test/app"

/** Imita a Web Speech API: o teste decide o que foi "ouvido" e quando a fala termina. */
class FakeRecognition {
  static last: FakeRecognition | null = null
  lang = ""
  interimResults = false
  continuous = false
  maxAlternatives = 0
  onresult: ((event: { results: unknown }) => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  start = vi.fn(() => {
    FakeRecognition.last = this
  })
  stop = vi.fn(() => this.onend?.())
  abort = vi.fn()

  hear(transcript: string) {
    act(() => this.onresult?.({ results: [{ isFinal: true, 0: { transcript } }] }))
  }

  finish() {
    act(() => this.onend?.())
  }

  fail(error: string) {
    act(() => {
      this.onerror?.({ error })
      this.onend?.()
    })
  }
}

function recognition(): FakeRecognition {
  if (!FakeRecognition.last) throw new Error("O reconhecimento de voz não foi iniciado")
  return FakeRecognition.last
}

const ifood = {
  understood: true,
  type: "expense",
  amount: 52,
  category: "Alimentação",
  title: "iFood",
  date: "2026-10-27",
}

describe("ditado por voz no formulário", () => {
  setupAppTests()
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    FakeRecognition.last = null
    vi.stubGlobal("webkitSpeechRecognition", FakeRecognition)
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(ifood)))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  async function openForm() {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole("button", { name: "Nova transação" }))
    return { user, dialog: screen.getByRole("dialog", { name: "Adicionar transação" }) }
  }

  it("preenche os campos com o que foi dito e só salva quando o usuário confirma", async () => {
    const { user, dialog } = await openForm()
    expect(within(dialog).getByRole("status")).toHaveTextContent("Prefere falar?")

    await user.click(within(dialog).getByRole("button", { name: "Ditar transação" }))
    expect(recognition().lang).toBe("pt-BR")
    expect(within(dialog).getByRole("status")).toHaveTextContent("Ouvindo…")

    recognition().hear("gastei 52 reais no ifood ontem")
    expect(within(dialog).getByRole("status")).toHaveTextContent("“gastei 52 reais no ifood ontem”")
    recognition().finish()

    await waitFor(() => expect(within(dialog).getByRole("status")).toHaveTextContent("Pronto!"))
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      text: "gastei 52 reais no ifood ontem",
      today: "2026-10-28",
    })
    expect(within(dialog).getByLabelText("Descrição")).toHaveValue("iFood")
    expect(within(dialog).getByLabelText("Tipo")).toHaveValue("expense")
    expect(within(dialog).getByLabelText("Valor")).toHaveValue(52)
    expect(within(dialog).getByLabelText("Categoria")).toHaveValue("Alimentação")
    expect(within(dialog).getByLabelText("Data")).toHaveValue("2026-10-27")
    expect(savedTransactions()).toHaveLength(fixture.length)

    await user.click(within(dialog).getByRole("button", { name: "Adicionar transação" }))
    expect(savedTransactions()).toContainEqual(
      expect.objectContaining({ title: "iFood", amount: 52, category: "Alimentação", date: "2026-10-27" }),
    )
  })

  it("muda para receita quando a fala é de dinheiro recebido", async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(JSON.stringify({ ...ifood, type: "income", category: "Renda", title: "Freelance", amount: 800 })),
    )
    const { user, dialog } = await openForm()

    await user.click(within(dialog).getByRole("button", { name: "Ditar transação" }))
    recognition().hear("recebi 800 reais de um freela")
    recognition().finish()

    await waitFor(() => expect(within(dialog).getByLabelText("Tipo")).toHaveValue("income"))
    expect(within(dialog).getByLabelText("Categoria")).toHaveValue("Renda")
  })

  it("sem valor na frase, mantém o campo vazio e leva o foco até ele", async () => {
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ ...ifood, amount: null, title: "Aluguel" })))
    const { user, dialog } = await openForm()

    await user.click(within(dialog).getByRole("button", { name: "Ditar transação" }))
    recognition().hear("paguei o aluguel")
    recognition().finish()

    await waitFor(() => expect(within(dialog).getByLabelText("Descrição")).toHaveValue("Aluguel"))
    expect(within(dialog).getByLabelText("Valor")).toHaveValue(null)
    expect(within(dialog).getByLabelText("Valor")).toHaveFocus()
  })

  it("tocar de novo no microfone para de ouvir e usa o que já foi dito", async () => {
    const { user, dialog } = await openForm()

    await user.click(within(dialog).getByRole("button", { name: "Ditar transação" }))
    recognition().hear("gastei 52 reais no ifood")
    await user.click(within(dialog).getByRole("button", { name: "Parar de ouvir" }))

    expect(recognition().stop).toHaveBeenCalled()
    await waitFor(() => expect(within(dialog).getByLabelText("Descrição")).toHaveValue("iFood"))
  })

  it("explica quando o microfone está bloqueado, sem chamar a IA", async () => {
    const { user, dialog } = await openForm()

    await user.click(within(dialog).getByRole("button", { name: "Ditar transação" }))
    recognition().fail("not-allowed")

    expect(within(dialog).getByRole("status")).toHaveTextContent("O microfone está bloqueado")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("explica quando a frase não é uma transação e não mexe nos campos", async () => {
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ ...ifood, understood: false })))
    const { user, dialog } = await openForm()
    await user.type(within(dialog).getByLabelText("Descrição"), "Cinema")

    await user.click(within(dialog).getByRole("button", { name: "Ditar transação" }))
    recognition().hear("qual a previsão do tempo")
    recognition().finish()

    await waitFor(() => expect(within(dialog).getByRole("status")).toHaveTextContent("Não reconheci"))
    expect(within(dialog).getByLabelText("Descrição")).toHaveValue("Cinema")
  })

  it("avisa quando o ditado ainda não foi configurado no servidor", async () => {
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ error: "not_configured" }), { status: 503 }))
    const { user, dialog } = await openForm()

    await user.click(within(dialog).getByRole("button", { name: "Ditar transação" }))
    recognition().hear("gastei 10 reais")
    recognition().finish()

    await waitFor(() => expect(within(dialog).getByRole("status")).toHaveTextContent("não foi configurado"))
  })

  it("cancela a interpretação ao fechar o formulário", async () => {
    let signal: AbortSignal | undefined
    fetchMock.mockImplementation((_, init) => {
      signal = init?.signal ?? undefined
      return new Promise(() => {})
    })
    const { user, dialog } = await openForm()

    await user.click(within(dialog).getByRole("button", { name: "Ditar transação" }))
    recognition().hear("gastei 10 reais")
    recognition().finish()
    await waitFor(() => expect(within(dialog).getByRole("status")).toHaveTextContent("Entendendo…"))
    expect(within(dialog).getByRole("button", { name: "Ditar transação" })).toBeDisabled()

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }))
    expect(signal?.aborted).toBe(true)
  })

  it("não mostra o microfone ao editar uma transação", async () => {
    const user = userEvent.setup()
    renderApp("/transacoes")

    await user.click(screen.getByRole("button", { name: "Opções de Projeto freelance" }))
    await user.click(screen.getByRole("menuitem", { name: "Editar" }))

    expect(screen.getByRole("dialog", { name: "Editar transação" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Ditar transação" })).not.toBeInTheDocument()
  })

  it("não mostra o microfone em navegadores sem reconhecimento de voz", async () => {
    vi.unstubAllGlobals()
    const { dialog } = await openForm()

    expect(within(dialog).queryByRole("button", { name: "Ditar transação" })).not.toBeInTheDocument()
    expect(within(dialog).queryByRole("status")).not.toBeInTheDocument()
  })
})
