import { useMemo } from "react"
import { useSearchParams } from "react-router"
import { useLayoutContext } from "@/components/layout/AppLayout"
import { FilterTabs } from "@/components/transactions/FilterTabs"
import { TransactionRow } from "@/components/transactions/TransactionRow"
import { Panel, PanelHeading } from "@/components/ui/Panel"
import { useTransactionsStore } from "@/context/AppDataContext"
import { categories } from "@/data/categories"
import { summarize } from "@/lib/analytics"
import { formatCurrency, formatMonthLong, formatTransactionCount } from "@/lib/format"
import {
  applyFilters,
  filtersFromParams,
  filtersToParams,
  monthsWithTransactions,
  typeFilterOptions,
  type TransactionFilters,
} from "@/lib/transactionFilters"
import type { Category } from "@/types/transaction"
import styles from "./Transactions.module.css"

export function Transactions() {
  const { transactions } = useTransactionsStore()
  const { search, editTransaction, deleteTransaction } = useLayoutContext()
  const [params, setParams] = useSearchParams()
  const filters = filtersFromParams(params)

  const visible = useMemo(() => applyFilters(transactions, filters, search), [transactions, params, search])
  const summary = summarize(visible)
  const months = useMemo(() => {
    const list = monthsWithTransactions(transactions)
    // Mantém no seletor um mês vindo da URL mesmo que ele não tenha lançamentos.
    return filters.month && !list.includes(filters.month) ? [filters.month, ...list] : list
  }, [transactions, filters.month])

  const hasFilters = filters.type !== "all" || filters.month !== null || filters.category !== null

  function updateFilters(changes: Partial<TransactionFilters>) {
    setParams(filtersToParams({ ...filters, ...changes }), { replace: true })
  }

  return (
    <Panel as="section" className={styles.root}>
      <PanelHeading
        className={styles.heading}
        title="Lançamentos"
        description={formatTransactionCount(visible.length)}
        action={
          <FilterTabs options={typeFilterOptions} value={filters.type} onChange={(type) => updateFilters({ type })} />
        }
      />

      <div className={styles.toolbar}>
        <select
          aria-label="Mês"
          value={filters.month ?? ""}
          onChange={(event) => updateFilters({ month: event.target.value || null })}
        >
          <option value="">Todos os meses</option>
          {months.map((month) => (
            <option key={month} value={month}>
              {formatMonthLong(month)}
            </option>
          ))}
        </select>
        <select
          aria-label="Categoria"
          value={filters.category ?? ""}
          onChange={(event) => updateFilters({ category: (event.target.value || null) as Category | null })}
        >
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        {hasFilters && (
          <button type="button" className={styles.clear} onClick={() => setParams({}, { replace: true })}>
            Limpar filtros
          </button>
        )}
      </div>

      <dl className={styles.summary} aria-label="Resumo dos lançamentos filtrados">
        <div>
          <dt>Receitas</dt>
          <dd className={styles.income}>{formatCurrency(summary.income)}</dd>
        </div>
        <div>
          <dt>Despesas</dt>
          <dd className={styles.expense}>{formatCurrency(summary.expense)}</dd>
        </div>
        <div>
          <dt>Saldo</dt>
          <dd>{formatCurrency(summary.income - summary.expense)}</dd>
        </div>
      </dl>

      <div>
        {visible.length ? (
          visible.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              onEdit={() => editTransaction(transaction)}
              onDelete={() => deleteTransaction(transaction)}
            />
          ))
        ) : (
          <p className={styles.empty}>
            {transactions.length
              ? "Nenhuma transação com esses filtros."
              : "Nenhuma transação ainda. Use “Nova transação” para começar."}
          </p>
        )}
      </div>
    </Panel>
  )
}
