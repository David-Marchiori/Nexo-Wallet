// @vitest-environment node
// O "_" no nome impede a Vercel de publicar este arquivo como uma função.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { categories } from "../src/data/categories"
import { POST } from "./parse-transaction"

const draft = {
  understood: true,
  type: "expense",
  amount: 52,
  category: "Alimentação",
  title: "iFood",
  date: "2026-10-27",
}

function call(body: unknown) {
  return POST(
    new Request("http://localhost/api/parse-transaction", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  )
}

function claudeReply(text: string, stopReason = "end_turn") {
  return new Response(JSON.stringify({ stop_reason: stopReason, content: [{ type: "text", text }] }), { status: 200 })
}

describe("POST /api/parse-transaction", () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "chave-de-teste")
    vi.stubGlobal("fetch", fetchMock)
    vi.spyOn(console, "error").mockImplementation(() => {})
    fetchMock.mockResolvedValue(claudeReply(JSON.stringify(draft)))
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    fetchMock.mockReset()
  })

  it("devolve o rascunho que o Claude extraiu da frase", async () => {
    const response = await call({ text: "gastei 52 reais no ifood ontem", today: "2026-10-28" })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(draft)
  })

  it("chama a API do Claude com a chave do servidor, a frase e o calendário", async () => {
    await call({ text: "  gastei 52 reais no ifood ontem  ", today: "2026-10-28" })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("https://api.anthropic.com/v1/messages")
    expect(new Headers(init?.headers).get("x-api-key")).toBe("chave-de-teste")

    const body = JSON.parse(String(init?.body))
    expect(body.model).toBe("claude-haiku-5-5")
    const prompt = body.messages[0].content as string
    expect(prompt).toContain('Frase ditada: "gastei 52 reais no ifood ontem"')
    expect(prompt).toContain("- hoje, quarta-feira: 2026-10-28")
    expect(prompt).toContain("- ontem, terça-feira: 2026-10-27")
    expect(prompt).toContain("- quarta-feira: 2026-10-21")
  })

  it("usa no esquema exatamente as categorias do app", async () => {
    await call({ text: "paguei o aluguel", today: "2026-10-28" })

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body.output_config.format.schema.properties.category.enum).toEqual(categories)
  })

  it("monta o calendário certo na virada do mês", async () => {
    await call({ text: "gastei 10 reais", today: "2026-03-01" })

    const prompt = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).messages[0].content as string
    expect(prompt).toContain("- hoje, domingo: 2026-03-01")
    expect(prompt).toContain("- ontem, sábado: 2026-02-28")
  })

  it("permite trocar o modelo pela variável ANTHROPIC_MODEL", async () => {
    vi.stubEnv("ANTHROPIC_MODEL", "claude-sonnet-5-5")
    await call({ text: "gastei 10 reais", today: "2026-10-28" })

    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).model).toBe("claude-sonnet-5-5")
  })

  it.each([
    ["JSON inválido", "{"],
    ["sem texto", { today: "2026-10-28" }],
    ["texto vazio", { text: "   ", today: "2026-10-28" }],
    ["texto longo demais", { text: "a".repeat(301), today: "2026-10-28" }],
    ["data inválida", { text: "gastei 10 reais", today: "2026-02-30" }],
    ["sem data", { text: "gastei 10 reais" }],
  ])("recusa pedido com %s sem chamar o Claude", async (_, body) => {
    const response = await call(body)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "invalid_request" })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("avisa quando a chave não está configurada", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "")
    const response = await call({ text: "gastei 10 reais", today: "2026-10-28" })

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: "not_configured" })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    ["erro HTTP do Claude", () => new Response("{}", { status: 529 })],
    ["resposta cortada", () => claudeReply('{"understood": tr', "max_tokens")],
    ["recusa", () => claudeReply("", "refusal")],
    ["texto que não é JSON", () => claudeReply("não sei")],
  ])("responde 502 em caso de %s", async (_, reply) => {
    fetchMock.mockResolvedValue(reply())
    const response = await call({ text: "gastei 10 reais", today: "2026-10-28" })

    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: "ai_failed" })
  })

  it("responde 502 quando a rede falha", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"))
    const response = await call({ text: "gastei 10 reais", today: "2026-10-28" })

    expect(response.status).toBe(502)
  })

  it("não registra a frase do usuário nos logs", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }))
    await call({ text: "gastei 777 reais no segredo", today: "2026-10-28" })

    expect(console.error).toHaveBeenCalled()
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("segredo")
  })
})
