import { parseSettings, parseTransactions } from "@/lib/storage"
import type { Settings } from "@/types/settings"
import type { Transaction } from "@/types/transaction"

const BACKUP_VERSION = 1

export type Backup = {
  app: "nexo"
  version: number
  exportedAt: string
  transactions: Transaction[]
  settings: Settings
}

export function createBackup(transactions: Transaction[], settings: Settings, now = new Date()): Backup {
  return { app: "nexo", version: BACKUP_VERSION, exportedAt: now.toISOString(), transactions, settings }
}

export type ParsedBackup = {
  transactions: Transaction[]
  /** Itens do arquivo que não passaram na validação. */
  ignored: number
  /** Configurações do arquivo, se houver e forem válidas. */
  settings: Settings | null
}

/**
 * Lê o texto de um backup do Nexo. Também aceita uma lista simples de
 * transações. Retorna `null` se o conteúdo não for reconhecido.
 */
export function parseBackup(text: string): ParsedBackup | null {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return null
  }

  const isBackupObject =
    typeof value === "object" && value !== null && (value as Record<string, unknown>).app === "nexo"
  const raw = Array.isArray(value) ? value : isBackupObject ? (value as Record<string, unknown>).transactions : null

  const transactions = parseTransactions(raw)
  if (!transactions || !Array.isArray(raw)) return null

  return {
    transactions,
    ignored: raw.length - transactions.length,
    settings: isBackupObject ? parseSettings((value as Record<string, unknown>).settings) : null,
  }
}

/** Faz o navegador baixar um arquivo de texto. */
export function downloadTextFile(fileName: string, content: string, type = "application/json"): void {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
