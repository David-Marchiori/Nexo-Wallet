import { IconButton } from "@/components/ui/IconButton"
import { cx } from "@/lib/cx"
import styles from "./BalanceCard.module.css"

type BalanceCardProps = {
  /** Valor já formatado (ou mascarado). */
  value: string
  accountName: string
  change: string
  /** Se os valores do dashboard estão ocultos. */
  valuesHidden: boolean
  onToggleVisibility: () => void
  className?: string
}

export function BalanceCard({ value, accountName, change, valuesHidden, onToggleVisibility, className }: BalanceCardProps) {
  return (
    <article className={cx(styles.card, className)}>
      <div className={styles.top}>
        <span>Saldo disponível</span>
        <IconButton
          icon={valuesHidden ? "eyeOff" : "eye"}
          iconSize={18}
          label={valuesHidden ? "Mostrar valores" : "Ocultar valores"}
          aria-pressed={valuesHidden}
          className={styles.toggle}
          onClick={onToggleVisibility}
        />
      </div>
      <strong>{value}</strong>
      <div className={styles.footer}>
        <span>
          <i className={styles.dot} /> {accountName}
        </span>
        <span>{change}</span>
      </div>
      <div className={cx(styles.glow, styles.glowOne)} />
      <div className={cx(styles.glow, styles.glowTwo)} />
    </article>
  )
}
