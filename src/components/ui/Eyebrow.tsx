import type { ReactNode } from "react"
import styles from "./Eyebrow.module.css"

/** Texto pequeno em caixa alta, roxo, acima de um título. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className={styles.eyebrow}>{children}</span>
}
