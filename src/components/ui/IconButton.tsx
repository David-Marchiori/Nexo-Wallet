import type { ButtonHTMLAttributes } from "react"
import { Icon, type IconName } from "@/components/ui/Icon"
import { cx } from "@/lib/cx"
import styles from "./IconButton.module.css"

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName
  /** Texto para leitores de tela, já que o botão só tem ícone. */
  label: string
  /** `outlined`: quadrado com borda · `ghost`: só o ícone · `circle`: círculo com borda. */
  variant?: "outlined" | "ghost" | "circle"
  iconSize?: number
}

export function IconButton({
  icon,
  label,
  variant = "ghost",
  iconSize,
  type = "button",
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button type={type} aria-label={label} className={cx(styles.base, styles[variant], className)} {...props}>
      <Icon name={icon} size={iconSize} />
      {children}
    </button>
  )
}
