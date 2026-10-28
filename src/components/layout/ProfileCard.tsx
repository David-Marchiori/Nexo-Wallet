import { Icon } from "@/components/ui/Icon"
import styles from "./ProfileCard.module.css"

type ProfileCardProps = {
  name: string
  initials: string
  subtitle: string
}

export function ProfileCard({ name, initials, subtitle }: ProfileCardProps) {
  return (
    <div className={styles.profile}>
      <div className={styles.avatar}>{initials}</div>
      <div className={styles.info}>
        <strong>{name}</strong>
        <span>{subtitle}</span>
      </div>
      <Icon name="more" />
    </div>
  )
}
