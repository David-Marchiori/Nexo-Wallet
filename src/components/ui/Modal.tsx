import { useId, type ReactNode } from "react"
import { Eyebrow } from "@/components/ui/Eyebrow"
import { IconButton } from "@/components/ui/IconButton"
import styles from "./Modal.module.css"

type ModalProps = {
  eyebrow: string
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ eyebrow, title, onClose, children }: ModalProps) {
  const titleId = useId()

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.modal}
        role="dialog"
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
