import type { RouteObject } from "react-router"
import { AppLayout, type RouteHandle } from "@/components/layout/AppLayout"
import { AppDataProvider } from "@/context/AppDataContext"
import { Dashboard } from "@/pages/Dashboard"
import { Goals } from "@/pages/Goals"
import { NotFound } from "@/pages/NotFound"
import { Reports } from "@/pages/Reports"
import { Settings } from "@/pages/Settings"
import { Transactions } from "@/pages/Transactions"

/**
 * Rotas do app. Todas as páginas ficam dentro do `AppLayout` (menu, topo e modais).
 * Ao publicar em hospedagem estática, redirecione todos os caminhos para `index.html`.
 */
export const routes: RouteObject[] = [
  {
    path: "/",
    element: (
      <AppDataProvider>
        <AppLayout />
      </AppDataProvider>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
        handle: {
          title: (firstName) => `Olá, ${firstName}.`,
          description: "Aqui está o resumo das suas finanças.",
          search: true,
        } satisfies RouteHandle,
      },
      {
        path: "transacoes",
        element: <Transactions />,
        handle: { title: "Transações", description: "Todos os seus lançamentos.", search: true } satisfies RouteHandle,
      },
      {
        path: "relatorios",
        element: <Reports />,
        handle: { title: "Relatórios", description: "Análises detalhadas por mês." } satisfies RouteHandle,
      },
      {
        path: "metas",
        element: <Goals />,
        handle: { title: "Metas", description: "Acompanhe quanto você economiza por mês." } satisfies RouteHandle,
      },
      {
        path: "configuracoes",
        element: <Settings />,
        handle: { title: "Configurações", description: "Perfil e dados do aplicativo." } satisfies RouteHandle,
      },
      {
        path: "*",
        element: <NotFound />,
        handle: { title: "Página não encontrada", description: "Confira o endereço ou volte ao início." } satisfies RouteHandle,
      },
    ],
  },
]
