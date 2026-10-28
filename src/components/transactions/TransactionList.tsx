import { useState } from "react"
import { Link } from "react-router"
import { FilterTabs } from "@/components/transactions/FilterTabs"
import { TransactionRow } from "@/components/transactions/TransactionRow"
import { Panel, PanelHeading } from "@/components/ui/Panel"
import { applyFilters, transactionsPath, typeFilterOptions } from "@/lib/transactionFilters"
import type { Transaction, TransactionFilter } from "@/types/transaction"
import styles from "./TransactionList.module.css"

const MAX_VISIBLE = 6

type TransactionListProps = {
  transactions: Transaction[]
  search: string
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}

/** Últimas transações do dashboard, com filtro por tipo e link para a lista completa. */
export function TransactionList({ transactions, search, onEdit, onDelete }: TransactionListProps) {
  const [filter, setFilter] = useState<TransactionFilter>("all")
  const visible = applyFilters(transactions, { type: filter, month: null, category: null }, search).slice(
    0,
    MAX_VISIBLE,
  )

  return (
    <Panel as="section" className={styles.root}>
      <PanelHeading
        className={styles.heading}
        title="Transações recentes"
        description="Seus últimos lançamentos"
        action={<FilterTabs options={typeFilterOptions} value={filter} onChange={setFilter} />}
      />
      <div>
        {visible.length ? (
          visible.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              onEdit={() => onEdit(transaction)}
              onDelete={() => onDelete(transaction)}
            />
          ))
        ) : (
          <div className={styles.empty}>Nenhuma transação encontrada.</div>
        )}
      </div>
      <Link className={styles.seeAll} to={transactionsPath({ type: filter })}>
        Ver todas as transações
      </Link>
    </Panel>
  )
}
