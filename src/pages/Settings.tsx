import { useId, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { Button } from "@/components/ui/Button"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { FormField } from "@/components/ui/FormField"
import { Panel, PanelHeading } from "@/components/ui/Panel"
import { useSettingsStore, useTransactionsStore } from "@/context/AppDataContext"
import { createSampleTransactions } from "@/data/sampleTransactions"
import { createBackup, downloadTextFile, parseBackup, type ParsedBackup } from "@/lib/backup"
import { cx } from "@/lib/cx"
import { toISODate } from "@/lib/date"
import { formatTransactionCount } from "@/lib/format"
import { initialsOf } from "@/lib/profile"
import styles from "./Settings.module.css"

type Feedback = { tone: "success" | "error"; text: string }
type PendingAction = { kind: "import"; backup: ParsedBackup } | { kind: "samples" } | { kind: "clear" }

export function Settings() {
  const { transactions, replaceTransactions } = useTransactionsStore()
  const { settings, updateSettings } = useSettingsStore()
  const [profileSaved, setProfileSaved] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const nameId = useId()
  const current = formatTransactionCount(transactions.length)

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = String(new FormData(event.currentTarget).get("name")).trim()
    if (!name) return
    updateSettings({ name })
    setProfileSaved(true)
  }

  function handleExport() {
    const backup = createBackup(transactions, settings)
    downloadTextFile(`nexo-backup-${toISODate(new Date())}.json`, JSON.stringify(backup, null, 2))
    setFeedback({ tone: "success", text: `Backup exportado com ${current}.` })
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = "" // permite escolher o mesmo arquivo de novo
    if (!file) return

    const backup = parseBackup(await file.text())
    if (!backup) {
      setFeedback({ tone: "error", text: "Não foi possível ler o arquivo. Escolha um backup exportado pelo Nexo (.json)." })
      return
    }
    setPending({ kind: "import", backup })
  }

  function confirmPending() {
    if (!pending) return
    if (pending.kind === "import") {
      replaceTransactions(pending.backup.transactions)
      if (pending.backup.settings) updateSettings(pending.backup.settings)
      setFeedback({ tone: "success", text: `Backup importado: ${formatTransactionCount(pending.backup.transactions.length)}.` })
    } else if (pending.kind === "samples") {
      replaceTransactions(createSampleTransactions(new Date()))
      setFeedback({ tone: "success", text: "Exemplos restaurados." })
    } else {
      replaceTransactions([])
      setFeedback({ tone: "success", text: "Todas as transações foram apagadas." })
    }
    setPending(null)
  }

  return (
    <div className={styles.stack}>
      <Panel className={styles.panel}>
        <PanelHeading title="Perfil" description="Como você aparece no menu e na saudação." />
        <form className={styles.profileForm} onSubmit={handleProfileSubmit} onChange={() => setProfileSaved(false)}>
          <div className={styles.avatar} aria-hidden="true">
            {initialsOf(settings.name)}
          </div>
          <FormField label="Nome" htmlFor={nameId}>
            <input id={nameId} name="name" defaultValue={settings.name} maxLength={60} required />
          </FormField>
          <Button type="submit">Salvar</Button>
        </form>
        {profileSaved && (
          <p className={cx(styles.feedback, styles.success)} role="status">
            Perfil atualizado.
          </p>
        )}
      </Panel>

      <Panel className={styles.panel}>
        <PanelHeading
          title="Backup"
          description="Seus dados ficam só neste navegador. Exporte um arquivo para guardar ou levar para outro dispositivo."
        />
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleExport}>
            Exportar backup
          </Button>
          <Button variant="secondary" onClick={() => fileInput.current?.click()}>
            Importar backup
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            className={styles.fileInput}
            aria-label="Arquivo de backup"
            onChange={handleFileChange}
          />
        </div>
        {feedback && (
          <p className={cx(styles.feedback, styles[feedback.tone])} role={feedback.tone === "error" ? "alert" : "status"}>
            {feedback.text}
          </p>
        )}
      </Panel>

      <Panel className={cx(styles.panel, styles.danger)}>
        <PanelHeading title="Dados" description={`Salvo neste navegador: ${current}.`} />
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => setPending({ kind: "samples" })}>
            Restaurar exemplos
          </Button>
          <Button variant="danger" onClick={() => setPending({ kind: "clear" })}>
            Apagar todas as transações
          </Button>
        </div>
      </Panel>

      {pending?.kind === "import" && (
        <ConfirmDialog
          title="Importar backup?"
          message={`Isso substitui ${current} por ${formatTransactionCount(pending.backup.transactions.length)} do arquivo${
            pending.backup.ignored ? ` (${pending.backup.ignored} itens inválidos serão ignorados)` : ""
          }.`}
          confirmLabel="Importar"
          tone="primary"
          onConfirm={confirmPending}
          onCancel={() => setPending(null)}
        />
      )}
      {pending?.kind === "samples" && (
        <ConfirmDialog
          title="Restaurar exemplos?"
          message={`Isso substitui ${current} pelos exemplos dos últimos 6 meses.`}
          confirmLabel="Restaurar"
          onConfirm={confirmPending}
          onCancel={() => setPending(null)}
        />
      )}
      {pending?.kind === "clear" && (
        <ConfirmDialog
          title="Apagar todas as transações?"
          message={`Isso apaga ${current}. Essa ação não pode ser desfeita; se quiser, exporte um backup antes.`}
          confirmLabel="Apagar tudo"
          onConfirm={confirmPending}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  )
}
