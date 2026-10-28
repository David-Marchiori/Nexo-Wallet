import { Link } from "react-router"
import { Icon } from "@/components/ui/Icon"
import { cx } from "@/lib/cx"
import styles from "./GoalCard.module.css"

type GoalCardProps = {
  title: string
  description: string
  /** Progresso de 0 a 100. */
  progress: number
  to: string
  onNavigate?: () => void
  className?: string
}

export function GoalCard({ title, description, progress, to, onNavigate, className }: GoalCardProps) {
  return (
    <Link to={to} onClick={onNavigate} className={cx(styles.card, className)}>
      <div className={styles.icon}>
        <Icon name="target" />
      </div>
      <strong>{title}</strong>
      <span>{description}</span>
      <div className={styles.progress}>
        <i style={{ width: `${progress}%` }} />
      </div>
      <small>{`${progress}% concluído`}</small>
    </Link>
  )
}
