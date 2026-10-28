import type { ButtonHTMLAttributes } from "react"
import { Link } from "react-router"
import { Icon, type IconName } from "@/components/ui/Icon"
import { cx } from "@/lib/cx"
import styles from "./IconButton.module.css"

/** `outlined`: quadrado com borda · `ghost`: só o ícone · `circle`: círculo com borda. */
type Variant = "outlined" | "ghost" | "circle"

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName
  /** Texto para leitores de tela, já que o botão só tem ícone. */
  label: string
  variant?: Variant
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

type IconLinkProps = {
  to: string
  icon: IconName
  label: string
  variant?: Variant
  iconSize?: number
  className?: string
}

/** Link de navegação com aparência de `IconButton`. */
export function IconLink({ to, icon, label, variant = "ghost", iconSize, className }: IconLinkProps) {
  return (
    <Link to={to} aria-label={label} className={cx(styles.base, styles[variant], className)}>
      <Icon name={icon} size={iconSize} />
    </Link>
  )
}
