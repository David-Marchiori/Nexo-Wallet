import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { interpretSpeech, toVoiceDraft, VOICE_ENDPOINT, VoiceDraftError } from "@/lib/voiceTransaction"

const TODAY = "2026-10-28"

const reply = {
  understood: true,
  type: "expense",
  amount: 52,
  category: "Alimentação",
  title: "iFood",
  date: "2026-10-27",
}

describe("toVoiceDraft", () => {
  it("aceita uma resposta válida", () => {
    expect(toVoiceDraft(reply, TODAY)).toEqual({
      type: "expense",
      amount: 52,
      category: "Alimentação",
      title: "iFood",
      date: "2026-10-27",
    })
  })

  it("retorna null quando a frase não é uma transação ou a resposta não é um objeto", () => {
    expect(toVoiceDraft({ ...reply, understood: false }, TODAY)).toBeNull()
    expect(toVoiceDraft(null, TODAY)).toBeNull()
    expect(toVoiceDraft("iFood", TODAY)).toBeNull()
  })

  it("aceita a categoria com outras maiúsculas", () => {
    expect(toVoiceDraft({ ...reply, category: "alimentação" }, TODAY)?.category).toBe("Alimentação")
  })

  it("troca por Outros a categoria desconhecida ou incompatível com o tipo", () => {
    expect(toVoiceDraft({ ...reply, category: "Saúde" }, TODAY)?.category).toBe("Outros")
    expect(toVoiceDraft({ ...reply, category: "Renda" }, TODAY)?.category).toBe("Outros")
    expect(toVoiceDraft({ ...reply, type: "income", category: "Lazer" }, TODAY)?.category).toBe("Outros")
  })

  it("aceita receitas com a categoria Renda", () => {
    expect(toVoiceDraft({ ...reply, type: "income", category: "Renda" }, TODAY)).toMatchObject({
      type: "income",
      category: "Renda",
    })
  })

  it("trata tipo desconhecido como despesa", () => {
    expect(toVoiceDraft({ ...reply, type: "transfer" }, TODAY)?.type).toBe("expense")
  })

  it.each([null, 0, -10, Number.NaN, "52"])("deixa o valor vazio quando vem %s", (amount) => {
    expect(toVoiceDraft({ ...reply, amount }, TODAY)?.amount).toBeNull()
  })

  it("arredonda o valor para centavos", () => {
    expect(toVoiceDraft({ ...reply, amount: 52.899 }, TODAY)?.amount).toBe(52.9)
  })

  it("usa hoje quando a data é inválida", () => {
    expect(toVoiceDraft({ ...reply, date: "2026-02-30" }, TODAY)?.date).toBe(TODAY)
    expect(toVoiceDraft({ ...reply, date: "ontem" }, TODAY)?.date).toBe(TODAY)
  })

  it("limpa e encurta a descrição", () => {
    expect(toVoiceDraft({ ...reply, title: "  Mercado  " }, TODAY)?.title).toBe("Mercado")
    expect(toVoiceDraft({ ...reply, title: "a".repeat(80) }, TODAY)?.title).toHaveLength(60)
    expect(toVoiceDraft({ ...reply, title: 42 }, TODAY)?.title).toBe("")
  })
})

describe("interpretSpeech", () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  const respond = (body: unknown, status = 200) =>
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }))

  it("envia a frase e a data de hoje para a função", async () => {
    respond(reply)

    await expect(interpretSpeech("gastei 52 reais no ifood ontem", TODAY)).resolves.toMatchObject({ title: "iFood" })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(VOICE_ENDPOINT)
    expect(init?.method).toBe("POST")
    expect(JSON.parse(String(init?.body))).toEqual({ text: "gastei 52 reais no ifood ontem", today: TODAY })
  })

  it.each([
    ["a frase não é uma transação", () => respond({ ...reply, understood: false }), "Não reconheci"],
    ["a chave não está configurada", () => respond({ error: "not_configured" }, 503), "não foi configurado"],
    ["a frase é recusada", () => respond({ error: "invalid_request" }, 400), "Tente uma mais curta"],
    ["o limite gratuito acaba", () => respond({ error: "rate_limited" }, 429), "limite gratuito"],
    ["a IA falha", () => respond({ error: "ai_failed" }, 502), "Não consegui entender agora"],
    ["a função não existe", () => fetchMock.mockResolvedValue(new Response("<html>", { status: 404 })), "Não consegui"],
    ["a rede cai", () => fetchMock.mockRejectedValue(new TypeError("Failed to fetch")), "Não consegui"],
  ])("explica o problema quando %s", async (_, setup, message) => {
    setup()

    const error = await interpretSpeech("gastei 10 reais", TODAY).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(VoiceDraftError)
    expect((error as Error).message).toContain(message)
  })

  it("repassa o cancelamento sem transformá-lo em mensagem", async () => {
    const controller = new AbortController()
    controller.abort()
    fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"))

    const error = await interpretSpeech("gastei 10 reais", TODAY, controller.signal).catch((caught: unknown) => caught)
    expect(error).not.toBeInstanceOf(VoiceDraftError)
  })
})
