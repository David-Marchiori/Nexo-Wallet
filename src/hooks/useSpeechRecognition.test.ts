import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  MAX_LISTEN_MS,
  SILENCE_MS,
  START_TIMEOUT_MS,
  STOP_GRACE_MS,
  useSpeechRecognition,
} from "@/hooks/useSpeechRecognition"

/**
 * Reconhecimento falso controlado pelo teste. Por padrão, `stop` não dispara `onend`,
 * como acontece às vezes no Safari do iPhone.
 */
class FakeRecognition {
  static last: FakeRecognition
  lang = ""
  interimResults = false
  continuous = false
  maxAlternatives = 0
  onstart: (() => void) | null = null
  onaudiostart: (() => void) | null = null
  onresult: ((event: { results: unknown }) => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  start = vi.fn()
  stop = vi.fn()
  abort = vi.fn()

  constructor() {
    FakeRecognition.last = this
  }

  begin() {
    act(() => this.onstart?.())
  }

  hear(transcript: string) {
    act(() => this.onresult?.({ results: [{ isFinal: false, 0: { transcript } }] }))
  }

  end() {
    act(() => this.onend?.())
  }

  fail(error: string) {
    act(() => {
      this.onerror?.({ error })
      this.onend?.()
    })
  }
}

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe("useSpeechRecognition", () => {
  const onResult = vi.fn()
  const onError = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal("webkitSpeechRecognition", FakeRecognition)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    onResult.mockReset()
    onError.mockReset()
  })

  function listen() {
    const hook = renderHook(() => useSpeechRecognition({ onResult, onError }))
    act(() => hook.result.current.start())
    return { hook, recognition: FakeRecognition.last }
  }

  it("ouve em português e entrega a frase quando o navegador termina", () => {
    const { hook, recognition } = listen()
    expect(recognition.lang).toBe("pt-BR")
    expect(recognition.start).toHaveBeenCalledOnce()
    expect(hook.result.current.listening).toBe(true)

    recognition.begin()
    recognition.hear("gastei 52 reais")
    expect(hook.result.current.transcript).toBe("gastei 52 reais")
    recognition.end()

    expect(onResult).toHaveBeenCalledExactlyOnceWith("gastei 52 reais")
    expect(hook.result.current.listening).toBe(false)
  })

  it("avisa quando o navegador não começa a ouvir (iPhone sem Ditado ou Siri)", () => {
    const { hook, recognition } = listen()

    advance(START_TIMEOUT_MS)

    expect(recognition.abort).toHaveBeenCalled()
    expect(hook.result.current.listening).toBe(false)
    expect(onError).toHaveBeenCalledExactlyOnceWith(expect.stringContaining("ligue o Ditado ou a Siri"))
  })

  it("não desiste enquanto o navegador está ouvindo", () => {
    const { hook, recognition } = listen()
    recognition.begin()

    advance(START_TIMEOUT_MS)

    expect(hook.result.current.listening).toBe(true)
    expect(onError).not.toHaveBeenCalled()
  })

  it("parar sem o navegador ter começado explica o problema, mesmo sem o evento de fim", () => {
    const { hook, recognition } = listen()

    act(() => hook.result.current.stop())
    expect(recognition.stop).toHaveBeenCalledOnce()
    expect(hook.result.current.listening).toBe(true)

    advance(STOP_GRACE_MS)
    expect(hook.result.current.listening).toBe(false)
    expect(onError).toHaveBeenCalledExactlyOnceWith(expect.stringContaining("não começou a ouvir"))
  })

  it("parar depois de falar usa o que já foi ouvido, mesmo sem o evento de fim", () => {
    const { hook, recognition } = listen()
    recognition.hear("paguei o aluguel")

    act(() => hook.result.current.stop())
    advance(STOP_GRACE_MS)

    expect(onResult).toHaveBeenCalledExactlyOnceWith("paguei o aluguel")
    expect(onError).not.toHaveBeenCalled()
  })

  it("encerra sozinho depois de uma pausa na fala", () => {
    const { recognition } = listen()
    recognition.hear("gastei 30")
    advance(SILENCE_MS - 1)
    recognition.hear("gastei 30 reais no mercado")

    advance(SILENCE_MS - 1)
    expect(recognition.stop).not.toHaveBeenCalled()
    advance(1)
    expect(recognition.stop).toHaveBeenCalledOnce()

    recognition.end()
    expect(onResult).toHaveBeenCalledExactlyOnceWith("gastei 30 reais no mercado")
  })

  it("não ouve para sempre", () => {
    const { recognition } = listen()
    recognition.begin()

    advance(MAX_LISTEN_MS)
    expect(recognition.stop).toHaveBeenCalledOnce()
    advance(STOP_GRACE_MS)

    expect(onError).toHaveBeenCalledExactlyOnceWith(expect.stringContaining("Não ouvi nada"))
  })

  it.each([
    ["not-allowed", "O microfone está bloqueado"],
    ["service-not-allowed", "O reconhecimento de voz está desligado"],
    ["no-speech", "Não ouvi nada"],
    ["network", "precisa de internet"],
    ["algo-novo", "Não foi possível usar o microfone"],
  ])("traduz o erro %s", (error, message) => {
    const { recognition } = listen()

    recognition.fail(error)

    expect(onError).toHaveBeenCalledExactlyOnceWith(expect.stringContaining(message))
    expect(onResult).not.toHaveBeenCalled()
  })

  it("chama um callback só, mesmo com erro, fim e prazos acontecendo juntos", () => {
    const { hook, recognition } = listen()
    recognition.hear("gastei 10")
    act(() => hook.result.current.stop())

    recognition.fail("network")
    recognition.end()
    advance(MAX_LISTEN_MS)

    expect(onError).toHaveBeenCalledOnce()
    expect(onResult).not.toHaveBeenCalled()
  })

  it("permite ouvir de novo depois de terminar", () => {
    const { hook } = listen()
    advance(START_TIMEOUT_MS)

    act(() => hook.result.current.start())
    FakeRecognition.last.hear("recebi 800")
    FakeRecognition.last.end()

    expect(onResult).toHaveBeenCalledExactlyOnceWith("recebi 800")
  })

  it("ao desmontar, para de ouvir sem chamar nada", () => {
    const { hook, recognition } = listen()
    recognition.hear("gastei 10")

    hook.unmount()
    advance(MAX_LISTEN_MS)

    expect(recognition.abort).toHaveBeenCalled()
    expect(onResult).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })
})
