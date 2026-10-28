import { Link } from "react-router"
import { Icon } from "@/components/ui/Icon"
import styles from "./ProfileCard.module.css"

type ProfileCardProps = {
  name: string
  initials: string
  subtitle: string
  to: string
  onNavigate?: () => void
}

export function ProfileCard({ name, initials, subtitle, to, onNavigate }: ProfileCardProps) {
  return (
    <Link to={to} onClick={onNavigate} className={styles.profile}>
      <div className={styles.avatar}>{initials}</div>
      <div className={styles.info}>
        <strong>{name}</strong>
        <span>{subtitle}</span>
      </div>
      <Icon name="more" />
    </Link>
  )
}
