import { Icon } from "@/components/ui/Icon"
import { IconButton } from "@/components/ui/IconButton"
import { cx } from "@/lib/cx"
import styles from "./MetricCard.module.css"

export type ChangeTone = "positive" | "negative" | "neutral"

type MetricCardProps = {
  variant: "income" | "expense"
  label: string
  /** Valor já formatado (ou mascarado). */
  value: string
  /** Variação em relação ao mês anterior, ex.: "+8,2%"; `null` quando não há mês anterior. */
  change: string | null
  /** Se a variação é boa (verde) ou ruim (vermelho) para quem lê. */
  changeTone: ChangeTone
  actionLabel: string
}

export function MetricCard({ variant, label, value, change, changeTone, actionLabel }: MetricCardProps) {
  return (
    <article className={styles.card}>
      <div className={cx(styles.icon, styles[variant])}>
        <Icon name={variant === "income" ? "arrowDown" : "arrowUp"} />
      </div>
      <div className={styles.copy}>
        <span>{label}</span>
        <strong>{value}</strong>
        {change === null ? (
          <small>Sem dados do mês anterior</small>
        ) : (
          <small>
            <b className={styles[changeTone]}>{change}</b> vs. mês anterior
          </small>
        )}
      </div>
      <IconButton variant="circle" icon="chevron" iconSize={17} label={actionLabel} />
    </article>
  )
}
