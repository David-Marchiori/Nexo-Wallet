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

const BLOCKED = "O microfone está bloqueado. Libere o acesso nas configurações do navegador para ditar."

/** Códigos de erro da Web Speech API → mensagem para o usuário. */
const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": BLOCKED,
  "service-not-allowed": BLOCKED,
  "audio-capture": "Nenhum microfone encontrado neste aparelho.",
  "no-speech": "Não ouvi nada. Toque no microfone e fale de novo.",
  network: "O reconhecimento de voz precisa de internet. Verifique a conexão.",
  "language-not-supported": "Este navegador não reconhece fala em português.",
}

const GENERIC_ERROR = "Não foi possível usar o microfone. Tente de novo."

type Options = {
  /** Frase final reconhecida, já sem espaços nas pontas. */
  onResult: (text: string) => void
  onError: (message: string) => void
}

/**
 * Reconhecimento de fala em pt-BR pelo navegador. Ao chamar `start`, o navegador pede
 * permissão para usar o microfone (só em https ou localhost). Ouve uma frase e para sozinho;
 * `stop` encerra antes e usa o que já foi ouvido.
 */
export function useSpeechRecognition({ onResult, onError }: Options) {
  const [supported] = useState(() => getRecognitionConstructor() !== null)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const recognitionRef = useRef<Recognition | null>(null)
  const callbacksRef = useRef({ onResult, onError })

  useEffect(() => {
    callbacksRef.current = { onResult, onError }
  })

  // Ao desmontar, para de ouvir sem disparar nenhum callback.
  useEffect(
    () => () => {
      const recognition = recognitionRef.current
      if (!recognition) return
      recognition.onresult = recognition.onerror = recognition.onend = null
      recognition.abort()
    },
    [],
  )

  const start = useCallback(() => {
    const RecognitionConstructor = getRecognitionConstructor()
    if (!RecognitionConstructor || recognitionRef.current) return

    const recognition = new RecognitionConstructor()
    recognition.lang = "pt-BR"
    recognition.interimResults = true
    recognition.continuous = false
    recognition.maxAlternatives = 1

    let text = ""
    let failed = false

    recognition.onresult = (event) => {
      text = Array.from(event.results, (result) => result[0].transcript)
        .join("")
        .trim()
      setTranscript(text)
    }
    recognition.onerror = (event) => {
      if (event.error === "aborted") return
      failed = true
      callbacksRef.current.onError(ERROR_MESSAGES[event.error] ?? GENERIC_ERROR)
    }
    recognition.onend = () => {
      recognitionRef.current = null
      setListening(false)
      if (failed) return
      if (text) callbacksRef.current.onResult(text)
      else callbacksRef.current.onError(ERROR_MESSAGES["no-speech"])
    }

    recognitionRef.current = recognition
    setTranscript("")
    setListening(true)
    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
      setListening(false)
      callbacksRef.current.onError(GENERIC_ERROR)
    }
  }, [])

  const stop = useCallback(() => recognitionRef.current?.stop(), [])

  return { supported, listening, transcript, start, stop }
}
