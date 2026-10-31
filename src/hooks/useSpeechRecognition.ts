import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Parte da Web Speech API usada aqui; o TypeScript não traz esses tipos.
 * Chrome, Edge e Safari implementam (o Chrome com o prefixo `webkit`); o Firefox não.
 */
type RecognitionResultList = ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>

type Recognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onaudiostart: (() => void) | null
  onresult: ((event: { results: RecognitionResultList }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type RecognitionConstructor = new () => Recognition

function getRecognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null
  const speechWindow = window as unknown as {
    SpeechRecognition?: RecognitionConstructor
    webkitSpeechRecognition?: RecognitionConstructor
  }
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null
}

/**
 * Tempo para o navegador começar a ouvir. Inclui os pedidos de permissão da primeira vez.
 * No iPhone, sem Ditado nem Siri ou pelo atalho da tela de início, ele não começa nem avisa erro.
 */
export const START_TIMEOUT_MS = 10_000
/** Pausa depois da fala que encerra a escuta (no iPhone a sessão nem sempre termina sozinha). */
export const SILENCE_MS = 2_500
/** Escuta máxima de uma frase. */
export const MAX_LISTEN_MS = 20_000
/** Espera pelo fim depois de pedir para parar; passado isso, usa o que já ouviu. */
export const STOP_GRACE_MS = 2_000

const NOT_STARTED =
  "O navegador não começou a ouvir. No iPhone, ligue o Ditado ou a Siri nos Ajustes e abra o Nexo direto no Safari."
const NO_SPEECH = "Não ouvi nada. Toque no microfone e fale de novo."
const GENERIC_ERROR = "Não foi possível usar o microfone. Tente de novo."

/** Códigos de erro da Web Speech API → mensagem para o usuário. */
const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "O microfone está bloqueado. Libere o acesso nas configurações do navegador para ditar.",
  "service-not-allowed":
    "O reconhecimento de voz está desligado neste aparelho. No iPhone, ligue o Ditado ou a Siri nos Ajustes.",
  "audio-capture": "Nenhum microfone encontrado neste aparelho.",
  "no-speech": NO_SPEECH,
  network: "O reconhecimento de voz precisa de internet. Verifique a conexão.",
  "language-not-supported": "Este navegador não reconhece fala em português.",
}

type Options = {
  /** Frase final reconhecida, já sem espaços nas pontas. */
  onResult: (text: string) => void
  onError: (message: string) => void
}

type Session = {
  stop: () => void
  /** Encerra sem chamar nenhum callback (ao desmontar). */
  cancel: () => void
}

type Outcome = { text: string } | { error: string } | null

/**
 * Reconhecimento de fala em pt-BR pelo navegador. Ao chamar `start`, o navegador pede
 * permissão para usar o microfone (só em https ou localhost). Ouve uma frase e para sozinho;
 * `stop` encerra antes e usa o que já foi ouvido.
 *
 * Cada escuta termina sempre com exatamente um `onResult` ou `onError`, mesmo quando o
 * navegador não avisa o fim (o Safari do iPhone às vezes não começa nem termina).
 */
export function useSpeechRecognition({ onResult, onError }: Options) {
  const [supported] = useState(() => getRecognitionConstructor() !== null)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const sessionRef = useRef<Session | null>(null)
  const callbacksRef = useRef({ onResult, onError })

  useEffect(() => {
    callbacksRef.current = { onResult, onError }
  })

  useEffect(() => () => sessionRef.current?.cancel(), [])

  const start = useCallback(() => {
    const RecognitionConstructor = getRecognitionConstructor()
    if (!RecognitionConstructor || sessionRef.current) return

    const recognition = new RecognitionConstructor()
    recognition.lang = "pt-BR"
    recognition.interimResults = true
    recognition.continuous = false
    recognition.maxAlternatives = 1

    let text = ""
    let started = false
    let stopping = false
    let done = false
    let silenceTimer: ReturnType<typeof setTimeout> | undefined
    const timers = new Set<ReturnType<typeof setTimeout>>()

    function after(ms: number, callback: () => void) {
      const id = setTimeout(() => {
        timers.delete(id)
        callback()
      }, ms)
      timers.add(id)
      return id
    }

    function finish(outcome: Outcome) {
      if (done) return
      done = true
      timers.forEach(clearTimeout)
      timers.clear()
      recognition.onstart = recognition.onaudiostart = recognition.onresult = recognition.onerror = recognition.onend = null
      sessionRef.current = null
      setListening(false)
      if (outcome === null) return
      if ("text" in outcome) callbacksRef.current.onResult(outcome.text)
      else callbacksRef.current.onError(outcome.error)
    }

    /** Encerra também o reconhecimento do navegador, que pode continuar ouvindo. */
    function finishAndAbort(outcome: Outcome) {
      finish(outcome)
      try {
        recognition.abort()
      } catch {
        // Já estava parado.
      }
    }

    /** O que já foi ouvido; sem nada, explica se o navegador chegou a começar. */
    const outcomeSoFar = (): Outcome => (text ? { text } : { error: started ? NO_SPEECH : NOT_STARTED })

    function stop() {
      if (done || stopping) return
      stopping = true
      try {
        recognition.stop()
      } catch {
        // Já estava parado; o fim chega pelo prazo abaixo.
      }
      after(STOP_GRACE_MS, () => finishAndAbort(outcomeSoFar()))
    }

    const markStarted = () => {
      started = true
    }
    recognition.onstart = markStarted
    recognition.onaudiostart = markStarted
    recognition.onresult = (event) => {
      started = true
      text = Array.from(event.results, (result) => result[0].transcript)
        .join("")
        .trim()
      setTranscript(text)
      if (silenceTimer !== undefined) {
        clearTimeout(silenceTimer)
        timers.delete(silenceTimer)
      }
      if (text) silenceTimer = after(SILENCE_MS, stop)
    }
    recognition.onerror = (event) => {
      if (event.error === "aborted") return
      finish({ error: ERROR_MESSAGES[event.error] ?? GENERIC_ERROR })
    }
    recognition.onend = () => finish(outcomeSoFar())

    sessionRef.current = { stop, cancel: () => finishAndAbort(null) }
    setTranscript("")
    setListening(true)
    try {
      recognition.start()
    } catch {
      finish({ error: GENERIC_ERROR })
      return
    }
    after(START_TIMEOUT_MS, () => {
      if (!started) finishAndAbort({ error: NOT_STARTED })
    })
    after(MAX_LISTEN_MS, stop)
  }, [])

  const stop = useCallback(() => sessionRef.current?.stop(), [])

  return { supported, listening, transcript, start, stop }
}
