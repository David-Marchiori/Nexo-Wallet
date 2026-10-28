import { Fragment } from "react"
import { GoalCard } from "@/components/layout/GoalCard"
import { NavItem } from "@/components/layout/NavItem"
import { ProfileCard } from "@/components/layout/ProfileCard"
import { Icon, type IconName } from "@/components/ui/Icon"
import { IconButton } from "@/components/ui/IconButton"
import type { GoalStatus } from "@/lib/analytics"
import { cx } from "@/lib/cx"
import styles from "./Sidebar.module.css"

const navSections: { label: string; items: { label: string; icon: IconName; to: string }[] }[] = [
  {
    label: "VISÃO GERAL",
    items: [
      { label: "Dashboard", icon: "grid", to: "/" },
      { label: "Transações", icon: "swap", to: "/transacoes" },
      { label: "Relatórios", icon: "chart", to: "/relatorios" },
    ],
  },
  {
    label: "PLANEJAMENTO",
    items: [
      { label: "Metas", icon: "target", to: "/metas" },
      { label: "Configurações", icon: "settings", to: "/configuracoes" },
    ],
  },
]

type SidebarProps = {
  /** Aberto como gaveta no celular. */
  open: boolean
  onClose: () => void
  goal: GoalStatus
  profile: { name: string; initials: string }
}

export function Sidebar({ open, onClose, goal, profile }: SidebarProps) {
  return (
    <>
      <aside className={cx(styles.sidebar, open && styles.open)}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <Icon name="wallet" size={22} />
          </div>
          <span>Nexo</span>
          <IconButton variant="outlined" icon="close" label="Fechar menu" className={styles.closeButton} onClick={onClose} />
        </div>

        <nav className={styles.nav} aria-label="Navegação principal">
          {navSections.map((section, index) => (
            <Fragment key={section.label}>
              <span className={cx(styles.navLabel, index > 0 && styles.navSection)}>{section.label}</span>
              {section.items.map((item) => (
                <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} onNavigate={onClose} />
              ))}
            </Fragment>
          ))}
        </nav>

        <GoalCard
          className={styles.goal}
          to="/metas"
          onNavigate={onClose}
          title="Meta do mês"
          description={goal.description}
          progress={goal.progress}
        />

        <ProfileCard
          to="/configuracoes"
          onNavigate={onClose}
          name={profile.name}
          initials={profile.initials}
          subtitle="Conta pessoal"
        />
      </aside>

      {open && <button type="button" className={styles.overlay} onClick={onClose} aria-label="Fechar menu" />}
    </>
  )
}
