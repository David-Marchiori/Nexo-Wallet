import type { ReactNode } from "react"
import { cx } from "@/lib/cx"
import styles from "./Panel.module.css"

type PanelProps = {
  as?: "article" | "section"
  className?: string
  children: ReactNode
}

/** Cartão branco com borda, usado nos blocos do dashboard. */
export function Panel({ as: Tag = "article", className, children }: PanelProps) {
  return <Tag className={cx(styles.panel, className)}>{children}</Tag>
}

type PanelHeadingProps = {
  title: string
  description: string
  /** Elemento à direita do título (botão, filtro…). */
  action?: ReactNode
  className?: string
}

export function PanelHeading({ title, description, action, className }: PanelHeadingProps) {
  return (
    <div className={cx(styles.heading, className)}>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}
