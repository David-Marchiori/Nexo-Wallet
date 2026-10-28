import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Link } from "react-router"
import { Icon, type IconName } from "@/components/ui/Icon"
import { cx } from "@/lib/cx"
import styles from "./Button.module.css"

type Variant = "primary" | "secondary" | "danger"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  icon?: IconName
}

export function Button({ variant = "primary", icon, type = "button", className, children, ...props }: ButtonProps) {
  return (
    <button type={type} className={cx(styles.button, styles[variant], className)} {...props}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  )
}

type ButtonLinkProps = {
  to: string
  variant?: Variant
  icon?: IconName
  className?: string
  children: ReactNode
}

/** Link de navegação com aparência de botão. */
export function ButtonLink({ to, variant = "primary", icon, className, children }: ButtonLinkProps) {
  return (
    <Link to={to} className={cx(styles.button, styles[variant], className)}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </Link>
  )
}
