import { useEffect, useId, useRef, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/Button"
import { FormField, FormRow } from "@/components/ui/FormField"
import { IconButton } from "@/components/ui/IconButton"
import { Modal, ModalActions } from "@/components/ui/Modal"
import { categoriesFor } from "@/data/categories"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { cx } from "@/lib/cx"
import { toISODate } from "@/lib/date"
import { interpretSpeech, VoiceDraftError, type VoiceDraft } from "@/lib/voiceTransaction"
import type { Category, NewTransaction, Transaction, TransactionType } from "@/types/transaction"
import styles from "./TransactionFormModal.module.css"

type TransactionFormModalProps = {
  /** Transação a editar; sem ela, o formulário cria uma nova. */
  transaction?: Transaction
  onClose: () => void
  onSubmit: (transaction: NewTransaction) => void
}

/** Etapa do ditado depois que o navegador para de ouvir. */
type VoiceState =
  | { status: "idle" }
  | { status: "processing"; transcript: string }
  | { status: "filled"; transcript: string }
  | { status: "error"; message: string }

export function TransactionFormModal({ transaction, onClose, onSubmit }: TransactionFormModalProps) {
  const id = useId()
  const editing = transaction !== undefined
  const initialType = transaction?.type ?? "expense"
  const [type, setType] = useState<TransactionType>(initialType)
  const [category, setCategory] = useState<Category>(() =>
    transaction && categoriesFor(initialType).includes(transaction.category)
      ? transaction.category
      : categoriesFor(initialType)[0],
  )
  const [title, setTitle] = useState(transaction?.title ?? "")
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "")
  const [date, setDate] = useState(() => transaction?.date ?? toISODate(new Date()))
  const availableCategories = categoriesFor(type)

  const [voice, setVoice] = useState<VoiceState>({ status: "idle" })
  const amountRef = useRef<HTMLInputElement>(null)
  const voiceRequestRef = useRef<AbortController | null>(null)

  // Fechar o formulário cancela a interpretação em andamento.
  useEffect(() => () => voiceRequestRef.current?.abort(), [])

  const speech = useSpeechRecognition({
    onResult: async (text) => {
      const request = new AbortController()
      voiceRequestRef.current = request
      setVoice({ status: "processing", transcript: text })
      try {
        const draft = await interpretSpeech(text, toISODate(new Date()), request.signal)
        applyDraft(draft)
        setVoice({ status: "filled", transcript: text })
      } catch (error) {
        if (request.signal.aborted) return
        const message = error instanceof VoiceDraftError ? error.message : "Não consegui entender agora."
        setVoice({ status: "error", message })
      }
    },
    onError: (message) => setVoice({ status: "error", message }),
  })

  /** Preenche só o que foi entendido; o usuário confere e salva. */
  function applyDraft(draft: VoiceDraft) {
    setType(draft.type)
    setCategory(draft.category)
    setDate(draft.date)
    if (draft.title) setTitle(draft.title)
    if (draft.amount !== null) setAmount(String(draft.amount))
    else amountRef.current?.focus()
  }

  function handleVoiceClick() {
    if (speech.listening) return speech.stop()
    voiceRequestRef.current?.abort()
    setVoice({ status: "idle" })
    speech.start()
  }

  function handleTypeChange(nextType: TransactionType) {
    setType(nextType)
    const nextCategories = categoriesFor(nextType)
    if (!nextCategories.includes(category)) setCategory(nextCategories[0])
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({ title: title.trim(), category, type, amount: Number(amount), date })
  }

  const voiceStatus = speech.listening
    ? {
        heading: "Ouvindo…",
        detail: speech.transcript ? `“${speech.transcript}”` : "Fale a despesa ou receita.",
      }
    : voice.status === "processing"
      ? { heading: "Entendendo…", detail: `“${voice.transcript}”` }
      : voice.status === "filled"
        ? { heading: "Pronto! Confira os campos antes de salvar.", detail: `“${voice.transcript}”` }
        : voice.status === "error"
          ? { heading: "Não deu certo", detail: voice.message }
          : {
              heading: "Prefere falar?",
              detail: "Toque no microfone e diga, por exemplo, “gastei 52 reais no iFood ontem”.",
            }

  return (
    <Modal
      eyebrow={editing ? "EDITAR LANÇAMENTO" : "NOVO LANÇAMENTO"}
      title={editing ? "Editar transação" : "Adicionar transação"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        {!editing && speech.supported && (
          <div className={cx(styles.voice, voice.status === "error" && !speech.listening && styles.voiceError)}>
            <IconButton
              icon="mic"
              iconSize={20}
              label={speech.listening ? "Parar de ouvir" : "Ditar transação"}
              className={cx(styles.mic, speech.listening && styles.listening)}
              disabled={voice.status === "processing"}
              onClick={handleVoiceClick}
            />
            <div className={styles.voiceText} role="status">
              <strong>{voiceStatus.heading}</strong>
              <span>{voiceStatus.detail}</span>
            </div>
          </div>
        )}
        <FormField label="Descrição" htmlFor={`${id}-title`}>
          <input
            id={`${id}-title`}
            name="title"
            placeholder="Ex: Compra no mercado"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            autoFocus
          />
        </FormField>
        <FormRow>
          <FormField label="Tipo" htmlFor={`${id}-type`}>
            <select
              id={`${id}-type`}
              name="type"
              value={type}
              onChange={(event) => handleTypeChange(event.target.value as TransactionType)}
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </FormField>
          <FormField label="Valor" htmlFor={`${id}-amount`}>
            <input
              ref={amountRef}
              id={`${id}-amount`}
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </FormField>
        </FormRow>
        <FormRow>
          <FormField label="Categoria" htmlFor={`${id}-category`}>
            <select
              id={`${id}-category`}
              name="category"
              value={category}
              onChange={(event) => setCategory(event.target.value as Category)}
            >
              {availableCategories.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Data" htmlFor={`${id}-date`}>
            <input
              id={`${id}-date`}
              name="date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </FormField>
        </FormRow>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          {editing ? (
            <Button type="submit">Salvar alterações</Button>
          ) : (
            <Button type="submit" icon="plus">
              Adicionar transação
            </Button>
          )}
        </ModalActions>
      </form>
    </Modal>
  )
}
