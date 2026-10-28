import { useMemo, useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { TransactionFormModal } from "@/components/transactions/TransactionFormModal"
import { currentUser } from "@/data/user"
import { useTransactions } from "@/hooks/useTransactions"
import { savingsGoalStatus, summarizeMonth } from "@/lib/analytics"
import { monthOf, toISODate } from "@/lib/date"
import { formatGreetingDate } from "@/lib/format"
import { Dashboard } from "@/pages/Dashboard"
import styles from "./App.module.css"

function App() {
  const { transactions, totals, addTransaction } = useTransactions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [mobileNav, setMobileNav] = useState(false)

  const today = new Date()
  const currentMonth = monthOf(toISODate(today))
  const goal = useMemo(
    () => savingsGoalStatus(summarizeMonth(transactions, currentMonth), currentUser.monthlySavingsGoal),
    [transactions, currentMonth],
  )

  return (
    <div className={styles.shell}>
      <Sidebar open={mobileNav} onClose={() => setMobileNav(false)} goal={goal} />

      <main className={styles.main}>
        <Topbar
          dateLabel={formatGreetingDate(today)}
          userFirstName={currentUser.firstName}
          search={search}
          onSearchChange={setSearch}
          onOpenMenu={() => setMobileNav(true)}
          onNewTransaction={() => setIsModalOpen(true)}
        />
        <Dashboard transactions={transactions} totals={totals} search={search} currentMonth={currentMonth} />
      </main>

      {isModalOpen && (
        <TransactionFormModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={(transaction) => {
            addTransaction(transaction)
            setIsModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

export default App
