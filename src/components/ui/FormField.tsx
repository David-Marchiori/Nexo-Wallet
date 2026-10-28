import type { ReactNode } from "react"
import styles from "./FormField.module.css"

type FormFieldProps = {
  label: string
  /** O `id` do campo dentro de `children`. */
  htmlFor: string
  children: ReactNode
}

/** Rótulo + campo (`input` ou `select`), que recebe o estilo padrão do formulário. */
export function FormField({ label, htmlFor, children }: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  )
}

/** Coloca campos lado a lado; no celular, um embaixo do outro. */
export function FormRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>
}
