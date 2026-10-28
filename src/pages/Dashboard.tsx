import { useState } from "react"
import { BalanceCard } from "@/components/dashboard/BalanceCard"
import { CashflowChart, type CashflowPoint } from "@/components/dashboard/CashflowChart"
import { ExpensesByCategory, type CategoryShare } from "@/components/dashboard/ExpensesByCategory"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { TransactionList } from "@/components/transactions/TransactionList"
import { formatCurrency } from "@/lib/format"
import type { Transaction, TransactionTotals } from "@/types/transaction"
import styles from "./Dashboard.module.css"

// Valores fixos vindos do design. Passam a ser calculados a partir das transações na fase 4.
const cashflowPlaceholder: CashflowPoint[] = [
  { month: "Dez", income: 42, expense: 35 },
  { month: "Jan", income: 58, expense: 44 },
  { month: "Fev", income: 48, expense: 62 },
  { month: "Mar", income: 67, expense: 45 },
  { month: "Abr", income: 76, expense: 57 },
  { month: "Mai", income: 88, expense: 49 },
]

const expenseSharesPlaceholder: CategoryShare[] = [
  { name: "Moradia", percent: 48, color: "#6944dc" },
  { name: "Alimentação", percent: 26, color: "#a791ee" },
  { name: "Assinaturas", percent: 14, color: "#d5caf8" },
  { name: "Outros", percent: 12, color: "#ebe7f1" },
]

type DashboardProps = {
  transactions: Transaction[]
  totals: TransactionTotals
  search: string
}

export function Dashboard({ transactions, totals, search }: DashboardProps) {
  const [balanceVisible, setBalanceVisible] = useState(true)
  const money = (value: number) => (balanceVisible ? formatCurrency(value) : "R$ ••••••")

  return (
    <>
      <section className={styles.summaryGrid}>
        <BalanceCard
          className={styles.balance}
          value={money(totals.balance)}
          accountName="Conta principal"
          change="+12,5% este mês"
          onToggleVisibility={() => setBalanceVisible((visible) => !visible)}
        />
        <MetricCard
          variant="income"
          label="Receitas"
          value={money(totals.income)}
          change="+8,2%"
          changeTone="positive"
          actionLabel="Ver receitas"
        />
        <MetricCard
          variant="expense"
          label="Despesas"
          value={money(totals.expense)}
          change="-3,4%"
          changeTone="negative"
          actionLabel="Ver despesas"
        />
      </section>

      <section className={styles.chartsGrid}>
        <CashflowChart data={cashflowPlaceholder} />
        <ExpensesByCategory total={totals.expense} categories={expenseSharesPlaceholder} />
      </section>

      <TransactionList transactions={transactions} search={search} />
    </>
  )
}
