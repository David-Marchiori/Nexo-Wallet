import { Icon, type IconName } from "@/components/ui/Icon"
import { cx } from "@/lib/cx"
import styles from "./NavItem.module.css"

type NavItemProps = {
  icon: IconName
  label: string
  active?: boolean
}

export function NavItem({ icon, label, active = false }: NavItemProps) {
  return (
    <button type="button" className={cx(styles.item, active && styles.active)}>
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  )
}
