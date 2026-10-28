import type { ReactNode } from "react"
import { Icon, type IconName } from "@/components/ui/Icon"
import { Panel } from "@/components/ui/Panel"
import styles from "./MessagePanel.module.css"

type MessagePanelProps = {
  icon: IconName
  title: string
  children: ReactNode
  action?: ReactNode
}

/** Painel centralizado com ícone, título e texto (ex.: "em breve", "não encontrado"). */
export function MessagePanel({ icon, title, children, action }: MessagePanelProps) {
  return (
    <Panel as="section" className={styles.panel}>
      <div className={styles.icon}>
        <Icon name={icon} size={24} />
      </div>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </Panel>
  )
}
