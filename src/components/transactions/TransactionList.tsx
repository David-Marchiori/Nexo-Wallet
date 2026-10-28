import { useState } from "react"
import { FilterTabs } from "@/components/transactions/FilterTabs"
import { TransactionRow } from "@/components/transactions/TransactionRow"
import { Panel, PanelHeading } from "@/components/ui/Panel"
import type { Transaction, TransactionFilter } from "@/types/transaction"
import styles from "./TransactionList.module.css"

const filterOptions: { value: TransactionFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "income", label: "Receitas" },
  { value: "expense", label: "Despesas" },
]

const MAX_VISIBLE = 6

type TransactionListProps = {
  transactions: Transaction[]
  search: string
}

export function TransactionList({ transactions, search }: TransactionListProps) {
  const [filter, setFilter] = useState<TransactionFilter>("all")

  const query = search.toLowerCase()
  const visible = transactions
    .filter((item) => filter === "all" || item.type === filter)
    .filter((item) => item.title.toLowerCase().includes(query))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_VISIBLE)

  return (
    <Panel as="section" className={styles.root}>
      <PanelHeading
        className={styles.heading}
        title="Transações recentes"
        description="Seus últimos lançamentos"
        action={<FilterTabs options={filterOptions} value={filter} onChange={setFilter} />}
      />
      <div>
        {visible.length ? (
          visible.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)
        ) : (
          <div className={styles.empty}>Nenhuma transação encontrada.</div>
        )}
      </div>
    </Panel>
  )
}
