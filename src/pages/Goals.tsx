import { useId, useMemo, useState, type FormEvent } from "react"
import { useLayoutContext } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { Panel, PanelHeading } from "@/components/ui/Panel"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { useSettingsStore, useTransactionsStore } from "@/context/AppDataContext"
import { monthlyCashflow, savingsGoalStatus } from "@/lib/analytics"
import { cx } from "@/lib/cx"
import { formatCurrency, formatMonthLong } from "@/lib/format"
import styles from "./Goals.module.css"

const HISTORY_MONTHS = 6

export function Goals() {
  const { transactions } = useTransactionsStore()
  const { settings, updateSettings } = useSettingsStore()
  const { currentMonth } = useLayoutContext()
  const [saved, setSaved] = useState(false)
  const inputId = useId()
  const goal = settings.monthlySavingsGoal

  // Do mês atual para trás.
  const history = useMemo(
    () =>
      monthlyCashflow(transactions, currentMonth, HISTORY_MONTHS)
        .reverse()
        .map((month) => ({ ...month, saved: month.income - month.expense, status: savingsGoalStatus(month, goal) })),
    [transactions, currentMonth, goal],
  )
  const [current, ...past] = history
  const achieved = past.filter((month) => month.saved >= goal).length

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = Number(new FormData(event.currentTarget).get("goal"))
    updateSettings({ monthlySavingsGoal: value })
    setSaved(true)
  }

  return (
    <div className={styles.grid}>
      <Panel className={styles.panel}>
        <PanelHeading title="Meta de economia mensal" description="Quanto você quer guardar por mês (receitas − despesas)." />
        <form className={styles.form} onSubmit={handleSubmit} onChange={() => setSaved(false)}>
          <FormField label="Valor da meta (R$)" htmlFor={inputId}>
            <input id={inputId} name="goal" type="number" min="0" step="0.01" defaultValue={goal} required />
          </FormField>
          <Button type="submit">Salvar meta</Button>
        </form>
        {saved && (
          <p className={styles.feedback} role="status">
            Meta atualizada para {formatCurrency(goal)}.
          </p>
        )}
      </Panel>

      <Panel className={styles.panel}>
        <PanelHeading title="Este mês" description={formatMonthLong(current.month)} />
        <p className={styles.amount}>
          <strong>{formatCurrency(current.saved)}</strong> de {formatCurrency(goal)}
        </p>
        <ProgressBar value={current.status.progress} label="Progresso da meta deste mês" />
        <p className={styles.caption}>
          {`${current.status.progress}% da meta`} · {current.status.description}
        </p>
      </Panel>

      <Panel as="section" className={cx(styles.panel, styles.history)}>
        <PanelHeading
          title="Histórico"
          description={`Meta atingida em ${achieved} dos ${past.length} meses anteriores (comparado à meta atual).`}
        />
        <ul className={styles.months}>
          {history.map((month, index) => {
            const isCurrent = index === 0
            const reached = month.saved >= goal
            return (
              <li key={month.month}>
                <span className={styles.monthName}>{formatMonthLong(month.month)}</span>
                <span className={styles.monthValue}>{formatCurrency(month.saved)}</span>
                <ProgressBar
                  className={styles.bar}
                  value={month.status.progress}
                  label={`Meta de ${formatMonthLong(month.month)}`}
                />
                <span className={cx(styles.badge, reached ? styles.reached : isCurrent ? styles.ongoing : styles.missed)}>
                  {reached ? "Atingida" : isCurrent ? "Em andamento" : `Faltaram ${formatCurrency(goal - month.saved)}`}
                </span>
              </li>
            )
          })}
        </ul>
      </Panel>
    </div>
  )
}
