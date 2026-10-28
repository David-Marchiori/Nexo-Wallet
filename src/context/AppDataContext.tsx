import { createContext, use, type ReactNode } from "react"
import { useSettings } from "@/hooks/useSettings"
import { useTransactions } from "@/hooks/useTransactions"

type TransactionsStore = ReturnType<typeof useTransactions>
type SettingsStore = ReturnType<typeof useSettings>

const TransactionsContext = createContext<TransactionsStore | null>(null)
const SettingsContext = createContext<SettingsStore | null>(null)

/** Guarda transações e configurações (salvas no navegador) para todas as páginas. */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const transactions = useTransactions()
  const settings = useSettings()

  return (
    <SettingsContext value={settings}>
      <TransactionsContext value={transactions}>{children}</TransactionsContext>
    </SettingsContext>
  )
}

export function useTransactionsStore(): TransactionsStore {
  const store = use(TransactionsContext)
  if (!store) throw new Error("useTransactionsStore precisa estar dentro de <AppDataProvider>")
  return store
}

export function useSettingsStore(): SettingsStore {
  const store = use(SettingsContext)
  if (!store) throw new Error("useSettingsStore precisa estar dentro de <AppDataProvider>")
  return store
}
