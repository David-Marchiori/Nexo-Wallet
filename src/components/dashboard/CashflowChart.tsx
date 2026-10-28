import { Icon } from "@/components/ui/Icon"
import { Panel, PanelHeading } from "@/components/ui/Panel"
import { cx } from "@/lib/cx"
import styles from "./CashflowChart.module.css"

export type CashflowPoint = {
  month: string
  /** Altura da barra de receitas, em % da área do gráfico. */
  income: number
  /** Altura da barra de despesas, em % da área do gráfico. */
  expense: number
}

export function CashflowChart({ data }: { data: CashflowPoint[] }) {
  return (
    <Panel className={styles.panel}>
      <PanelHeading
        title="Fluxo de caixa"
        description="Receitas e despesas dos últimos 6 meses"
        action={
          <button type="button" className={styles.periodButton}>
            <Icon name="calendar" size={16} /> Últimos 6 meses
          </button>
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
              <i className={cx(styles.bar, styles.incomeBar)} style={{ height: `${point.income}%` }} />
              <i className={cx(styles.bar, styles.expenseBar)} style={{ height: `${point.expense}%` }} />
            </div>
            <span>{point.month}</span>
          </div>
        ))}
        <div className={cx(styles.gridLine, styles.lineOne)} />
        <div className={cx(styles.gridLine, styles.lineTwo)} />
        <div className={cx(styles.gridLine, styles.lineThree)} />
      </div>
    </Panel>
  )
}
