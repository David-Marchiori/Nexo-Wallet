import { Fragment } from "react"
import { GoalCard } from "@/components/layout/GoalCard"
import { NavItem } from "@/components/layout/NavItem"
import { ProfileCard } from "@/components/layout/ProfileCard"
import { Icon, type IconName } from "@/components/ui/Icon"
import { IconButton } from "@/components/ui/IconButton"
import { currentUser } from "@/data/user"
import type { GoalStatus } from "@/lib/analytics"
import { cx } from "@/lib/cx"
import styles from "./Sidebar.module.css"

const navSections: { label: string; items: { label: string; icon: IconName }[] }[] = [
  {
    label: "VISÃO GERAL",
    items: [
      { label: "Dashboard", icon: "grid" },
      { label: "Transações", icon: "swap" },
      { label: "Relatórios", icon: "chart" },
    ],
  },
  {
    label: "PLANEJAMENTO",
    items: [
      { label: "Metas", icon: "target" },
      { label: "Configurações", icon: "settings" },
    ],
  },
]

// Só o Dashboard existe por enquanto; as outras páginas chegam com as rotas.
const activeItem = "Dashboard"

type SidebarProps = {
  /** Aberto como gaveta no celular. */
  open: boolean
  onClose: () => void
  goal: GoalStatus
}

export function Sidebar({ open, onClose, goal }: SidebarProps) {
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
                <NavItem key={item.label} icon={item.icon} label={item.label} active={item.label === activeItem} />
              ))}
            </Fragment>
          ))}
        </nav>

        <GoalCard className={styles.goal} title="Meta do mês" description={goal.description} progress={goal.progress} />

        <ProfileCard name={currentUser.name} initials={currentUser.initials} subtitle={currentUser.accountLabel} />
      </aside>

      {open && <button type="button" className={styles.overlay} onClick={onClose} aria-label="Fechar menu" />}
    </>
  )
}
