import { ActionMenu } from "@/components/ui/ActionMenu"
import { Icon } from "@/components/ui/Icon"
import { categoryTone } from "@/data/categories"
import { cx } from "@/lib/cx"
import { formatCurrency, formatShortDate } from "@/lib/format"
import type { Transaction } from "@/types/transaction"
import styles from "./TransactionRow.module.css"

type TransactionRowProps = {
  transaction: Transaction
  onEdit: () => void
  onDelete: () => void
}

export function TransactionRow({ transaction, onEdit, onDelete }: TransactionRowProps) {
  const isIncome = transaction.type === "income"

  return (
    <div className={styles.row}>
      <div className={cx(styles.icon, styles[categoryTone[transaction.category]])}>
        <Icon name={isIncome ? "arrowDown" : "arrowUp"} size={19} />
      </div>
      <div className={styles.name}>
        <strong>{transaction.title}</strong>
        <span>{transaction.category}</span>
      </div>
      <span className={styles.date}>{formatShortDate(transaction.date)}</span>
      <strong className={isIncome ? styles.income : styles.expense}>
        {isIncome ? "+" : "-"} {formatCurrency(transaction.amount)}
      </strong>
      <ActionMenu
        label={`Opções de ${transaction.title}`}
        items={[
          { label: "Editar", onSelect: onEdit },
          { label: "Excluir", onSelect: onDelete, tone: "danger" },
        ]}
      />
    </div>
  )
}
