# Nexo

Personal finance dashboard. React + Vite + TypeScript with CSS Modules, originally exported from Figma Make and now run locally (the Figma Make plugins and Tailwind were removed).

## Development Server

Uses **npm** (Node 24). No server is started automatically.

- `npm install` - Install dependencies
- `npm run dev` - Start the Vite dev server at http://localhost:5173 with hot reload
- `npm run typecheck` - Run `tsc --noEmit`
- `npm test` - Run the Vitest suite once (`npm run test:watch` to keep it running)
- `npm run build` - Type-check, then build to `dist/`

The app uses browser URLs (`/transacoes`, `/metas`…). On static hosting, rewrite every path to `/index.html` (e.g. Netlify `_redirects`: `/* /index.html 200`), or reloading a page other than `/` returns 404. `npm run dev` and `npm run preview` already do this.

## Project Structure

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx`
- `src/App.tsx` - Creates the browser router from `src/routes.tsx`
- `src/routes.tsx` - Route table (React Router 8, data router). Each route's `handle` sets the topbar title/description and whether the search box shows
- `src/components/layout/AppLayout.tsx` - Shell for every page: sidebar, topbar, `<Outlet>`, the create/edit transaction modal and the delete confirmation. Pages read `search`, `currentMonth`, `editTransaction` and `deleteTransaction` through `useLayoutContext()`
- `src/context/AppDataContext.tsx` - `AppDataProvider` plus `useTransactionsStore()` and `useSettingsStore()`; the single source of transactions and settings
- `src/pages/` - `Dashboard`, `Transactions` (full list, filters in the URL), `Goals`, `Settings` (profile, backup, reset), `Reports` (placeholder), `NotFound`
- `src/components/ui/` - Generic building blocks: `Icon`, `Button`/`ButtonLink`, `IconButton`/`IconLink`, `Modal`/`ModalActions`, `ConfirmDialog`, `ActionMenu`, `FormField`/`FormRow`, `Panel`/`PanelHeading`, `ProgressBar`, `MessagePanel`, `SearchInput`, `Eyebrow`
- `src/components/layout/` - `AppLayout`, `Sidebar` (with `NavItem`, `GoalCard`, `ProfileCard`) and `Topbar`
- `src/components/dashboard/` - `BalanceCard`, `MetricCard`, `CashflowChart`, `ExpensesByCategory`
- `src/components/transactions/` - `TransactionList`, `TransactionRow`, `FilterTabs`, `TransactionFormModal` (create and edit)
- `src/hooks/` - `useTransactions` (state, persistence, totals, add/update/remove/replace) and `useSettings` (name and savings goal)
- `src/lib/` - Pure helpers: `analytics` (monthly totals, cash flow, expense shares, savings goal), `transactionFilters` (URL filters and filtering), `storage` (localStorage with validation), `backup` (export/import JSON), `profile`, `date`, `format`, `id`, `cx`
- `src/data/` - Static data: categories (color tone and which transaction type each one allows), sample transactions generated relative to today, default settings
- `src/types/` - Shared TypeScript types
- `src/styles/reset.css` - Base reset (copy of Tailwind v4 Preflight) inside `@layer base`
- `src/index.css` - Fonts, reset import, color tokens on `:root`, `body` defaults

## Conventions

- Import across folders with the `@/` alias (`@/components/ui/Button`).
- Import routing APIs from `react-router` (pinned to `~8.4.0`).
- Pages get data from the stores and the layout context; components below pages receive data through props. Formatting lives in `src/lib/format.ts`, calculations in `src/lib/analytics.ts`.
- Links to the transactions page go through `transactionsPath({ type, month, category })`; URL params are in Portuguese (`/transacoes?tipo=despesas&mes=2026-10&categoria=Moradia`).
- Destructive actions (delete, import, reset) always go through `ConfirmDialog`.
- localStorage keys: `nexo-transactions` and `nexo-settings`. Everything read from storage or a backup file is validated in `src/lib/storage.ts`.
- Months are `AAAA-MM` strings and dates are `AAAA-MM-DD` strings, always in local time (`toISODate`, `monthOf`, `shiftMonth`). Never use `toISOString()` for dates.
- Dashboard cards: income and expenses are for the current month; balance is cumulative across all transactions.
- Icon-only buttons use `IconButton`, which requires a `label` (becomes `aria-label`).
- Render text that mixes a variable with literal characters as one template string (`` {`${value}%`} ``). Separate React text nodes lose kerning and render a few pixels differently.

## Styling

Each component has a `.module.css` next to it, with camelCase class names (`styles.cardTop`). Combine classes with `cx()` from `src/lib/cx.ts`. Global CSS is limited to `src/index.css`; use the color tokens defined there (`var(--purple)`, `var(--border)`…).

Breakpoints: `1100px` (tablet), `820px` (sidebar becomes a drawer), `620px` (phone). Each module keeps its own media queries.

When a parent needs to override a child component's style, pass a `className` and target it with a two-class selector in the parent's module (e.g. `.header .close`). This keeps priority independent of CSS load order.

The reset lives in `@layer base`, so any unlayered rule in `index.css` or a module wins over it.

## Testing

Vitest + Testing Library (jsdom), configured in `vite.config.ts` with `src/test/setup.ts` (clears storage and cleans up between tests). Tests sit next to the code (`*.test.ts(x)`). Query by role, label or text, not by CSS class: module class names are hashed.

For anything that renders the app, use `src/test/app.tsx`: call `setupAppTests()` inside the `describe` (fixed date 2026-10-28 and a known transaction set) and `renderApp("/path")` to mount the real routes in a memory router. Only `Date` is faked (`vi.useFakeTimers({ toFake: ["Date"] })`), so user-event keeps working. `src/App.test.tsx` covers layout, navigation and the dashboard; each page has its own `*.test.tsx` in `src/pages/`.
