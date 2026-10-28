import { cx } from "@/lib/cx"
import styles from "./ProgressBar.module.css"

type ProgressBarProps = {
  /** De 0 a 100. */
  value: number
  label: string
  className?: string
}

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      className={cx(styles.track, className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
    >
      <i className={cx(styles.fill, clamped >= 100 && styles.done)} style={{ width: `${clamped}%` }} />
    </div>
  )
}
