import { IconButton } from "@/components/ui/IconButton"
import { Panel, PanelHeading } from "@/components/ui/Panel"
import type { ExpenseShare } from "@/lib/analytics"
import styles from "./ExpensesByCategory.module.css"

const sliceColors = ["#6944dc", "#a791ee", "#d5caf8"]
const othersColor = "#ebe7f1"
const emptyColor = "#f1eef4"

type ExpensesByCategoryProps = {
  /** Total já formatado (ou mascarado). */
  total: string
  shares: ExpenseShare[]
}

function colorOf(share: ExpenseShare, index: number) {
  return share.name === "Outros" ? othersColor : sliceColors[index % sliceColors.length]
}

/** Monta o `conic-gradient` da rosca, uma fatia por categoria. */
function donutGradient(shares: ExpenseShare[]): string {
  if (shares.length === 0) return emptyColor
  let start = 0
  const slices = shares.map((share, index) => {
    const slice = `${colorOf(share, index)} ${start}% ${start + share.percent}%`
    start += share.percent
    return slice
  })
  return `conic-gradient(${slices.join(", ")})`
}

export function ExpensesByCategory({ total, shares }: ExpensesByCategoryProps) {
  return (
    <Panel className={styles.panel}>
      <PanelHeading
        title="Despesas por categoria"
        description="Distribuição deste mês"
        action={<IconButton icon="more" label="Mais opções" />}
      />
      <div className={styles.donutWrap}>
        <div className={styles.donut} style={{ background: donutGradient(shares) }}>
          <div>
            <strong>{total}</strong>
            <span>Total gasto</span>
          </div>
        </div>
      </div>
      {shares.length ? (
        <div className={styles.legend}>
          {shares.map((share, index) => (
            <div key={share.name}>
              <span>
                <i style={{ background: colorOf(share, index) }} />
                {share.name}
              </span>
              <strong>{`${share.percent}%`}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Nenhuma despesa neste mês.</p>
      )}
    </Panel>
  )
}
