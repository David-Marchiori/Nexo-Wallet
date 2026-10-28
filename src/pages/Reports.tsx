import { ButtonLink } from "@/components/ui/Button"
import { MessagePanel } from "@/components/ui/MessagePanel"

/** Página ainda não construída. */
export function Reports() {
  return (
    <MessagePanel
      icon="chart"
      title="Relatórios em breve"
      action={<ButtonLink to="/">Voltar ao Dashboard</ButtonLink>}
    >
      Aqui você vai poder escolher um mês e ver o resumo completo: receitas, despesas, saldo e gastos por categoria,
      comparados ao mês anterior.
    </MessagePanel>
  )
}
