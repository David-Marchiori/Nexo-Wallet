import { useEffect, useId, type ReactNode } from "react"
import { Eyebrow } from "@/components/ui/Eyebrow"
import { IconButton } from "@/components/ui/IconButton"
import styles from "./Modal.module.css"

type ModalProps = {
  eyebrow: string
  title: string
  onClose: () => void
  /** `alertdialog` para confirmações que pedem uma decisão. */
  role?: "dialog" | "alertdialog"
  children: ReactNode
}

export function Modal({ eyebrow, title, onClose, role = "dialog", children }: ModalProps) {
  const titleId = useId()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.modal}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2 id={titleId}>{title}</h2>
          </div>
          <IconButton variant="outlined" icon="close" label="Fechar" className={styles.close} onClick={onClose} />
        </div>
        {children}
      </section>
    </div>
  )
}

/** Linha de botões no rodapé do modal; no celular, empilhados com o principal por cima. */
export function ModalActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>
}
