import { Button } from "@/components/ui/Button"
import { Eyebrow } from "@/components/ui/Eyebrow"
import { Icon } from "@/components/ui/Icon"
import { IconButton } from "@/components/ui/IconButton"
import { SearchInput } from "@/components/ui/SearchInput"
import styles from "./Topbar.module.css"

type TopbarProps = {
  userFirstName: string
  search: string
  onSearchChange: (value: string) => void
  onOpenMenu: () => void
  onNewTransaction: () => void
}

export function Topbar({ userFirstName, search, onSearchChange, onOpenMenu, onNewTransaction }: TopbarProps) {
  return (
    <header className={styles.topbar}>
      <button type="button" className={styles.menuButton} onClick={onOpenMenu} aria-label="Abrir menu">
        <Icon name="grid" />
      </button>

      <div className={styles.greeting}>
        <Eyebrow>QUARTA, 14 DE MAIO</Eyebrow>
        <h1>{`Olá, ${userFirstName}.`}</h1>
        <p>Aqui está o resumo das suas finanças.</p>
      </div>

      <div className={styles.actions}>
        <SearchInput className={styles.search} value={search} onChange={onSearchChange} placeholder="Buscar transação" />
        <IconButton variant="outlined" icon="bell" label="Notificações" className={styles.notification}>
          <i />
        </IconButton>
        <Button icon="plus" className={styles.newButton} onClick={onNewTransaction}>
          Nova transação
        </Button>
      </div>
    </header>
  )
}
