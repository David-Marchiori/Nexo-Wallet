import { NavLink } from "react-router"
import { Icon, type IconName } from "@/components/ui/Icon"
import { cx } from "@/lib/cx"
import styles from "./NavItem.module.css"

type NavItemProps = {
  to: string
  icon: IconName
  label: string
  onNavigate?: () => void
}

/** Link do menu lateral; fica destacado (e com `aria-current="page"`) na página atual. */
export function NavItem({ to, icon, label, onNavigate }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) => cx(styles.item, isActive && styles.active)}
      onClick={onNavigate}
    >
      <Icon name={icon} />
      <span>{label}</span>
    </NavLink>
  )
}
