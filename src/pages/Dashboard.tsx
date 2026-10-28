import { useMemo, useState } from "react"
import { BalanceCard } from "@/components/dashboard/BalanceCard"
import { CashflowChart, type CashflowPeriod } from "@/components/dashboard/CashflowChart"
import { ExpensesByCategory } from "@/components/dashboard/ExpensesByCategory"
import { MetricCard, type ChangeTone } from "@/components/dashboard/MetricCard"
import { useLayoutContext } from "@/components/layout/AppLayout"
import { TransactionList } from "@/components/transactions/TransactionList"
import { useTransactionsStore } from "@/context/AppDataContext"
import {
  balanceBefore,
  expenseShares,
  monthlyCashflow,
  percentChange,
  summarizeMonth,
} from "@/lib/analytics"
import { shiftMonth } from "@/lib/date"
import { formatCurrency, formatPercentChange } from "@/lib/format"
import { transactionsPath } from "@/lib/transactionFilters"
import styles from "./Dashboard.module.css"

const HIDDEN_VALUE = "R$ ••••••"

/** Texto e cor da variação; `higherIsBetter` diz se subir é bom (receitas) ou ruim (despesas). */
function describeChange(ratio: number | null, higherIsBetter: boolean): { change: string | null; tone: ChangeTone } {
  if (ratio === null) return { change: null, tone: "neutral" }
  if (ratio === 0) return { change: formatPercentChange(0), tone: "neutral" }
  return { change: formatPercentChange(ratio), tone: ratio > 0 === higherIsBetter ? "positive" : "negative" }
}

export function Dashboard() {
  const { transactions, totals } = useTransactionsStore()
  const { search, currentMonth, editTransaction, deleteTransaction } = useLayoutContext()
  const [valuesHidden, setValuesHidden] = useState(false)
  const [period, setPeriod] = useState<CashflowPeriod>(6)
  const money = (value: number) => (valuesHidden ? HIDDEN_VALUE : formatCurrency(value))

  const month = useMemo(() => {
    const current = summarizeMonth(transactions, currentMonth)
    const previous = summarizeMonth(transactions, shiftMonth(currentMonth, -1))
    return {
      income: current.income,
      expense: current.expense,
      incomeChange: describeChange(percentChange(current.income, previous.income), true),
      expenseChange: describeChange(percentChange(current.expense, previous.expense), false),
      startBalance: balanceBefore(transactions, currentMonth),
      shares: expenseShares(transactions, currentMonth),
    }
  }, [transactions, currentMonth])

  const cashflow = useMemo(
    () => monthlyCashflow(transactions, currentMonth, period),
    [transactions, currentMonth, period],
  )

  // Variação do saldo no mês; sem saldo anterior não há percentual, então mostra o valor.
  const balanceRatio = percentChange(totals.balance, month.startBalance)
  const balanceDelta = totals.balance - month.startBalance
  const balanceChange =
    balanceRatio !== null
      ? `${formatPercentChange(balanceRatio)} este mês`
      : `${balanceDelta < 0 ? "-" : "+"}${money(Math.abs(balanceDelta))} este mês`

  return (
    <>
      <section className={styles.summaryGrid}>
        <BalanceCard
          className={styles.balance}
          value={money(totals.balance)}
          accountName="Conta principal"
          change={balanceChange}
          valuesHidden={valuesHidden}
          onToggleVisibility={() => setValuesHidden((hidden) => !hidden)}
        />
        <MetricCard
          variant="income"
          label="Receitas do mês"
          value={money(month.income)}
          change={month.incomeChange.change}
          changeTone={month.incomeChange.tone}
          action={{ label: "Ver receitas do mês", to: transactionsPath({ type: "income", month: currentMonth }) }}
        />
        <MetricCard
          variant="expense"
          label="Despesas do mês"
          value={money(month.expense)}
          change={month.expenseChange.change}
          changeTone={month.expenseChange.tone}
          action={{ label: "Ver despesas do mês", to: transactionsPath({ type: "expense", month: currentMonth }) }}
        />
      </section>

      <section className={styles.chartsGrid}>
        <CashflowChart data={cashflow} period={period} onPeriodChange={setPeriod} />
        <ExpensesByCategory
          total={money(month.expense)}
          shares={month.shares}
          detailsTo={transactionsPath({ type: "expense", month: currentMonth })}
        />
      </section>

      <TransactionList
        transactions={transactions}
        search={search}
        onEdit={editTransaction}
        onDelete={deleteTransaction}
      />
    </>
  )
}
