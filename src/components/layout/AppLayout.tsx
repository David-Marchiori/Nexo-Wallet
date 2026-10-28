import { useMemo, useState } from "react"
import { Outlet, ScrollRestoration, useMatches, useOutletContext } from "react-router"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { TransactionFormModal } from "@/components/transactions/TransactionFormModal"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { useSettingsStore, useTransactionsStore } from "@/context/AppDataContext"
import { savingsGoalStatus, summarizeMonth } from "@/lib/analytics"
import { monthOf, toISODate } from "@/lib/date"
import { formatCurrency, formatGreetingDate, formatShortDate } from "@/lib/format"
import { firstNameOf, initialsOf } from "@/lib/profile"
import type { Transaction } from "@/types/transaction"
import styles from "./AppLayout.module.css"

/** Informações de cada rota usadas pelo layout (definidas em `routes.tsx`). */
export type RouteHandle = {
  /** Título do topo; pode depender do primeiro nome do usuário. */
  title: string | ((firstName: string) => string)
  description: string
  /** Mostra a busca de transações no topo. */
  search?: boolean
}

/** O que o layout oferece às páginas (via `useLayoutContext`). */
export type LayoutContext = {
  search: string
  /** Mês atual, `AAAA-MM`. */
  currentMonth: string
  editTransaction: (transaction: Transaction) => void
  deleteTransaction: (transaction: Transaction) => void
}

export function useLayoutContext(): LayoutContext {
  return useOutletContext<LayoutContext>()
}

type FormState = { mode: "create" } | { mode: "edit"; transaction: Transaction } | null

export function AppLayout() {
  const { transactions, addTransaction, updateTransaction, removeTransaction } = useTransactionsStore()
  const { settings } = useSettingsStore()
  const [form, setForm] = useState<FormState>(null)
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null)
  const [search, setSearch] = useState("")
  const [mobileNav, setMobileNav] = useState(false)

  const matches = useMatches()
  const handle = matches[matches.length - 1]?.handle as RouteHandle | undefined
  const isHome = matches[matches.length - 1]?.pathname === "/"

  const today = new Date()
  const currentMonth = monthOf(toISODate(today))
  const firstName = firstNameOf(settings.name)
  const title = typeof handle?.title === "function" ? handle.title(firstName) : (handle?.title ?? "")

  const goal = useMemo(
    () => savingsGoalStatus(summarizeMonth(transactions, currentMonth), settings.monthlySavingsGoal),
    [transactions, currentMonth, settings.monthlySavingsGoal],
  )

  const context: LayoutContext = {
    search,
    currentMonth,
    editTransaction: (transaction) => setForm({ mode: "edit", transaction }),
    deleteTransaction: setPendingDelete,
  }

  return (
    <div className={styles.shell}>
      <title>{isHome ? "Nexo" : `${title} · Nexo`}</title>
      <ScrollRestoration />

      <Sidebar
        open={mobileNav}
        onClose={() => setMobileNav(false)}
        goal={goal}
        profile={{ name: settings.name, initials: initialsOf(settings.name) }}
      />

      <main className={styles.main}>
        <Topbar
          eyebrow={formatGreetingDate(today)}
          title={title}
          description={handle?.description ?? ""}
          search={handle?.search ? { value: search, onChange: setSearch } : undefined}
          onOpenMenu={() => setMobileNav(true)}
          onNewTransaction={() => setForm({ mode: "create" })}
        />
        <Outlet context={context} />
      </main>

      {form && (
        <TransactionFormModal
          transaction={form.mode === "edit" ? form.transaction : undefined}
          onClose={() => setForm(null)}
          onSubmit={(data) => {
            if (form.mode === "edit") updateTransaction(form.transaction.id, data)
            else addTransaction(data)
            setForm(null)
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Excluir transação?"
          message={
            <>
              <b>{pendingDelete.title}</b> ({formatCurrency(pendingDelete.amount)}, {formatShortDate(pendingDelete.date)})
              será excluída. Essa ação não pode ser desfeita.
            </>
          }
          confirmLabel="Excluir"
          onConfirm={() => {
            removeTransaction(pendingDelete.id)
            setPendingDelete(null)
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
