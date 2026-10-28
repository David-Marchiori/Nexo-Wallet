import type { ReactNode } from "react"
import { Button } from "@/components/ui/Button"
import { Modal, ModalActions } from "@/components/ui/Modal"
import styles from "./ConfirmDialog.module.css"

type ConfirmDialogProps = {
  title: string
  message: ReactNode
  confirmLabel: string
  /** `danger` para ações que apagam dados. */
  tone?: "primary" | "danger"
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmLabel, tone = "danger", onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal role="alertdialog" eyebrow="CONFIRMAR" title={title} onClose={onCancel}>
      <p className={styles.message}>{message}</p>
      <ModalActions>
        {/* O foco começa no Cancelar, para Enter não confirmar sem querer. */}
        <Button variant="secondary" onClick={onCancel} autoFocus>
          Cancelar
        </Button>
        <Button variant={tone} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </ModalActions>
    </Modal>
  )
}
