import { Icon } from "@/components/ui/Icon"
import { IconButton } from "@/components/ui/IconButton"
import { categoryTone } from "@/data/categories"
import { cx } from "@/lib/cx"
import { formatCurrency, formatShortDate } from "@/lib/format"
import type { Transaction } from "@/types/transaction"
import styles from "./TransactionRow.module.css"

export function TransactionRow({ transaction }: { transaction: Transaction }) {
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
      <IconButton icon="more" label="Mais opções" />
    </div>
  )
}
