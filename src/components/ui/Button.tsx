import type { ButtonHTMLAttributes } from "react"
import { Icon, type IconName } from "@/components/ui/Icon"
import { cx } from "@/lib/cx"
import styles from "./Button.module.css"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary"
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
