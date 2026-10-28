import { Button } from "@/components/ui/Button"
import { Eyebrow } from "@/components/ui/Eyebrow"
import { Icon } from "@/components/ui/Icon"
import { SearchInput } from "@/components/ui/SearchInput"
import styles from "./Topbar.module.css"

type TopbarProps = {
  /** Texto pequeno acima do título, ex.: "QUARTA, 28 DE OUTUBRO". */
  eyebrow: string
  title: string
  description: string
  /** Busca de transações; omitida nas páginas onde não se aplica. */
  search?: { value: string; onChange: (value: string) => void }
  onOpenMenu: () => void
  onNewTransaction: () => void
}

export function Topbar({ eyebrow, title, description, search, onOpenMenu, onNewTransaction }: TopbarProps) {
  return (
    <header className={styles.topbar}>
      <button type="button" className={styles.menuButton} onClick={onOpenMenu} aria-label="Abrir menu">
        <Icon name="grid" />
      </button>

      <div className={styles.greeting}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <div className={styles.actions}>
        {search && (
          <SearchInput
            className={styles.search}
            value={search.value}
            onChange={search.onChange}
            placeholder="Buscar transação"
          />
        )}
        <Button icon="plus" className={styles.newButton} onClick={onNewTransaction}>
          Nova transação
        </Button>
      </div>
    </header>
  )
}
