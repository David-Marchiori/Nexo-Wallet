import { ButtonLink } from "@/components/ui/Button"
import { MessagePanel } from "@/components/ui/MessagePanel"

export function NotFound() {
  return (
    <MessagePanel icon="search" title="Página não encontrada" action={<ButtonLink to="/">Voltar ao Dashboard</ButtonLink>}>
      O endereço que você abriu não existe no Nexo.
    </MessagePanel>
  )
}
