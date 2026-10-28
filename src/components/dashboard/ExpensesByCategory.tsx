import { IconButton } from "@/components/ui/IconButton"
import { Panel, PanelHeading } from "@/components/ui/Panel"
import { formatCurrency } from "@/lib/format"
import styles from "./ExpensesByCategory.module.css"

export type CategoryShare = {
  name: string
  /** Participação no total, de 0 a 100. */
  percent: number
  color: string
}

type ExpensesByCategoryProps = {
  total: number
  categories: CategoryShare[]
}

/** Monta o `conic-gradient` da rosca, uma fatia por categoria. */
function donutGradient(categories: CategoryShare[]): string {
  let start = 0
  const slices = categories.map(({ percent, color }) => {
    const slice = `${color} ${start}% ${start + percent}%`
    start += percent
    return slice
  })
  return `conic-gradient(${slices.join(", ")})`
}

export function ExpensesByCategory({ total, categories }: ExpensesByCategoryProps) {
  return (
    <Panel className={styles.panel}>
      <PanelHeading
        title="Despesas por categoria"
        description="Distribuição deste mês"
        action={<IconButton icon="more" label="Mais opções" />}
      />
      <div className={styles.donutWrap}>
        <div className={styles.donut} style={{ background: donutGradient(categories) }}>
          <div>
            <strong>{formatCurrency(total)}</strong>
            <span>Total gasto</span>
          </div>
        </div>
      </div>
      <div className={styles.legend}>
        {categories.map((category) => (
          <div key={category.name}>
            <span>
              <i style={{ background: category.color }} />
              {category.name}
            </span>
            <strong>{`${category.percent}%`}</strong>
          </div>
        ))}
      </div>
    </Panel>
  )
}
