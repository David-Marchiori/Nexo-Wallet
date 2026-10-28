import { Icon } from "@/components/ui/Icon"
import { cx } from "@/lib/cx"
import styles from "./GoalCard.module.css"

type GoalCardProps = {
  title: string
  description: string
  /** Progresso de 0 a 100. */
  progress: number
  className?: string
}

export function GoalCard({ title, description, progress, className }: GoalCardProps) {
  return (
    <div className={cx(styles.card, className)}>
      <div className={styles.icon}>
        <Icon name="target" />
      </div>
      <strong>{title}</strong>
      <span>{description}</span>
      <div className={styles.progress}>
        <i style={{ width: `${progress}%` }} />
      </div>
      <small>{`${progress}% concluído`}</small>
    </div>
  )
}
