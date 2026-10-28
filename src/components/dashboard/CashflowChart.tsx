import { Icon } from "@/components/ui/Icon"
import { Panel, PanelHeading } from "@/components/ui/Panel"
import type { CashflowMonth } from "@/lib/analytics"
import { cx } from "@/lib/cx"
import { formatMonthShort } from "@/lib/format"
import styles from "./CashflowChart.module.css"

export const PERIOD_OPTIONS = [3, 6, 12] as const
export type CashflowPeriod = (typeof PERIOD_OPTIONS)[number]

type CashflowChartProps = {
  data: CashflowMonth[]
  period: CashflowPeriod
  onPeriodChange: (period: CashflowPeriod) => void
}

/** Altura da barra em % da área do gráfico; o maior valor ocupa a altura toda. */
function barHeight(value: number, max: number) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0
  // Valor zero não ganha o "toco" mínimo de 10px, para não parecer que há lançamento.
  return { height: `${percent}%`, minHeight: value > 0 ? undefined : 0 }
}

export function CashflowChart({ data, period, onPeriodChange }: CashflowChartProps) {
  const max = Math.max(0, ...data.flatMap((point) => [point.income, point.expense]))
  const periodLabel = `Últimos ${period} meses`

  return (
    <Panel className={styles.panel}>
      <PanelHeading
        title="Fluxo de caixa"
        description={`Receitas e despesas dos últimos ${period} meses`}
        action={
          <label className={styles.periodButton}>
            <Icon name="calendar" size={16} />
            <span>{periodLabel}</span>
            <select
              aria-label="Período do gráfico"
              value={period}
              onChange={(event) => onPeriodChange(Number(event.target.value) as CashflowPeriod)}
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {`Últimos ${option} meses`}
                </option>
              ))}
            </select>
          </label>
        }
      />
      <div className={styles.legend}>
        <span>
          <i className={styles.legendIncome} /> Receitas
        </span>
        <span>
          <i className={styles.legendExpense} /> Despesas
        </span>
      </div>
      <div className={styles.chart}>
        {data.map((point) => (
          <div className={styles.group} key={point.month}>
            <div className={styles.bars}>
              <i className={cx(styles.bar, styles.incomeBar)} style={barHeight(point.income, max)} />
              <i className={cx(styles.bar, styles.expenseBar)} style={barHeight(point.expense, max)} />
            </div>
            <span>{formatMonthShort(point.month)}</span>
          </div>
        ))}
        <div className={cx(styles.gridLine, styles.lineOne)} />
        <div className={cx(styles.gridLine, styles.lineTwo)} />
        <div className={cx(styles.gridLine, styles.lineThree)} />
        {max === 0 && <p className={styles.empty}>Nenhum lançamento no período.</p>}
      </div>
    </Panel>
  )
}
