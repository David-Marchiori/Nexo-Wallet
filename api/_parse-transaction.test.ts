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

/** Resposta do generateContent com um candidato. */
function geminiReply(parts: { text: string; thought?: boolean }[], finishReason = "STOP") {
  return new Response(JSON.stringify({ candidates: [{ finishReason, content: { role: "model", parts } }] }), {
    status: 200,
  })
}

const sentBody = (fetchMock: ReturnType<typeof vi.fn<typeof fetch>>) =>
  JSON.parse(String(fetchMock.mock.calls[0][1]?.body))

describe("POST /api/parse-transaction", () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "chave-de-teste")
    vi.stubGlobal("fetch", fetchMock)
    vi.spyOn(console, "error").mockImplementation(() => {})
    fetchMock.mockResolvedValue(geminiReply([{ text: JSON.stringify(draft) }]))
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    fetchMock.mockReset()
  })

  it("devolve o rascunho que o Gemini extraiu da frase", async () => {
    const response = await call({ text: "gastei 52 reais no ifood ontem", today: "2026-10-28" })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(draft)
  })

  it("chama o Gemini com a chave do servidor, a frase e o calendário", async () => {
    await call({ text: "  gastei 52 reais no ifood ontem  ", today: "2026-10-28" })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
    )
    expect(new Headers(init?.headers).get("x-goog-api-key")).toBe("chave-de-teste")

    const body = sentBody(fetchMock)
    expect(body.systemInstruction.parts[0].text).toContain("Categorias:")
    expect(body.generationConfig.responseMimeType).toBe("application/json")
    const prompt = body.contents[0].parts[0].text as string
    expect(prompt).toContain('Frase ditada: "gastei 52 reais no ifood ontem"')
    expect(prompt).toContain("- hoje, quarta-feira: 2026-10-28")
    expect(prompt).toContain("- ontem, terça-feira: 2026-10-27")
    expect(prompt).toContain("- quarta-feira: 2026-10-21")
  })

  it("usa no esquema exatamente as categorias do app", async () => {
    await call({ text: "paguei o aluguel", today: "2026-10-28" })

    expect(sentBody(fetchMock).generationConfig.responseJsonSchema.properties.category.enum).toEqual(categories)
  })

  it("monta o calendário certo na virada do mês", async () => {
    await call({ text: "gastei 10 reais", today: "2026-03-01" })

    const prompt = sentBody(fetchMock).contents[0].parts[0].text as string
    expect(prompt).toContain("- hoje, domingo: 2026-03-01")
    expect(prompt).toContain("- ontem, sábado: 2026-02-28")
  })

  it("permite trocar o modelo pela variável GEMINI_MODEL", async () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-3.8-flash")
    await call({ text: "gastei 10 reais", today: "2026-10-28" })

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
    )
  })

  it("ignora o raciocínio e junta as partes do texto", async () => {
    const [start, end] = [JSON.stringify(draft).slice(0, 20), JSON.stringify(draft).slice(20)]
    fetchMock.mockResolvedValue(geminiReply([{ text: "pensando…", thought: true }, { text: start }, { text: end }]))

    const response = await call({ text: "gastei 52 reais no ifood", today: "2026-10-28" })
    expect(await response.json()).toEqual(draft)
  })

  it.each([
    ["JSON inválido", "{"],
    ["sem texto", { today: "2026-10-28" }],
    ["texto vazio", { text: "   ", today: "2026-10-28" }],
    ["texto longo demais", { text: "a".repeat(301), today: "2026-10-28" }],
    ["data inválida", { text: "gastei 10 reais", today: "2026-02-30" }],
    ["sem data", { text: "gastei 10 reais" }],
  ])("recusa pedido com %s sem chamar o Gemini", async (_, body) => {
    const response = await call(body)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "invalid_request" })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("avisa quando a chave não está configurada", async () => {
    vi.stubEnv("GEMINI_API_KEY", "")
    const response = await call({ text: "gastei 10 reais", today: "2026-10-28" })

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: "not_configured" })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("avisa quando o limite do plano gratuito acaba", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 429 }))
    const response = await call({ text: "gastei 10 reais", today: "2026-10-28" })

    expect(response.status).toBe(429)
    expect(await response.json()).toEqual({ error: "rate_limited" })
  })

  it.each([
    ["erro HTTP do Gemini", () => new Response("{}", { status: 500 })],
    ["chave recusada", () => new Response("{}", { status: 403 })],
    ["resposta cortada", () => geminiReply([{ text: '{"understood": tr' }], "MAX_TOKENS")],
    ["bloqueio de segurança", () => new Response(JSON.stringify({ promptFeedback: { blockReason: "SAFETY" } }))],
    ["resposta sem candidatos", () => new Response(JSON.stringify({ candidates: [] }))],
    ["texto que não é JSON", () => geminiReply([{ text: "não sei" }])],
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

  it("registra no log o motivo que o Google deu para recusar o pedido", async () => {
    const error = {
      code: 403,
      status: "PERMISSION_DENIED",
      message: "Generative Language API has not been used in project 123 before or it is disabled.",
      details: [{ "@type": "type.googleapis.com/google.rpc.ErrorInfo", reason: "SERVICE_DISABLED" }],
    }
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error }), { status: 403 }))

    const response = await call({ text: "gastei 10 reais", today: "2026-10-28" })

    expect(response.status).toBe(502)
    expect(console.error).toHaveBeenCalledExactlyOnceWith(
      "parse-transaction: ai_failed (HTTP 403 · PERMISSION_DENIED · SERVICE_DISABLED · Generative Language API has not been used in project 123 before or it is disabled.)",
    )
  })

  it("registra só o código HTTP quando o erro não vem em JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 500 }))
    await call({ text: "gastei 10 reais", today: "2026-10-28" })

    expect(console.error).toHaveBeenCalledExactlyOnceWith("parse-transaction: ai_failed (HTTP 500)")
  })

  it("não registra a frase do usuário nos logs", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }))
    await call({ text: "gastei 777 reais no segredo", today: "2026-10-28" })

    expect(console.error).toHaveBeenCalled()
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("segredo")
  })
})
