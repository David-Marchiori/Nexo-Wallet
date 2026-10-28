import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { TransactionFormModal } from "@/components/transactions/TransactionFormModal"
import { currentUser } from "@/data/user"
import { useTransactions } from "@/hooks/useTransactions"
import { Dashboard } from "@/pages/Dashboard"
import styles from "./App.module.css"

function App() {
  const { transactions, totals, addTransaction } = useTransactions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [mobileNav, setMobileNav] = useState(false)

  return (
    <div className={styles.shell}>
      <Sidebar open={mobileNav} onClose={() => setMobileNav(false)} />

      <main className={styles.main}>
        <Topbar
          userFirstName={currentUser.firstName}
          search={search}
          onSearchChange={setSearch}
          onOpenMenu={() => setMobileNav(true)}
          onNewTransaction={() => setIsModalOpen(true)}
        />
        <Dashboard transactions={transactions} totals={totals} search={search} />
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
