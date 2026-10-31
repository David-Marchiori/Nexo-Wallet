# Nexo

Personal finance dashboard. React + Vite + TypeScript with CSS Modules, originally exported from Figma Make and now run locally (the Figma Make plugins and Tailwind were removed).

## Development Server

Uses **npm** (Node 24). No server is started automatically.

- `npm install` - Install dependencies
- `npm run dev` - Start the Vite dev server at http://localhost:5173 with hot reload. It also serves `/api/<name>` from `api/<name>.ts` (a small plugin in `vite.config.ts`), so voice entry works locally once `GEMINI_API_KEY` is in `.env.local` (see `.env.example`)
- `npm run typecheck` - Run `tsc --noEmit`
- `npm test` - Run the Vitest suite once (`npm run test:watch` to keep it running)
- `npm run build` - Type-check, then build to `dist/`

The app uses browser URLs (`/transacoes`, `/metas`…). On static hosting, rewrite every path to `/index.html`, or reloading a page other than `/` returns 404. Production runs on Vercel, where `vercel.json` does this for every path except `/api/`. `npm run dev` and `npm run preview` already do this.

## Voice Entry

The "Nova transação" form has a microphone button (create mode only, hidden in browsers without the Web Speech API, such as Firefox):

1. `src/hooks/useSpeechRecognition.ts` - The browser transcribes one sentence in pt-BR (it asks for microphone permission; needs https or localhost)
2. `src/lib/voiceTransaction.ts` - Sends `{ text, today }` to `/api/parse-transaction` and validates the reply (`toVoiceDraft`) before it touches the form
3. `api/parse-transaction.ts` - Vercel Function that asks Gemini (`gemini-3.5-flash-lite` on Google's free tier, `generateContent` with `responseJsonSchema`) for type, amount, category, title and date
4. The form is filled for review; nothing is saved until the user confirms

Environment variables (Vercel project settings, or `.env.local` for `npm run dev`): `GEMINI_API_KEY` (required, created at https://aistudio.google.com/apikey) and `GEMINI_MODEL` (optional). Never prefix them with `VITE_`: Vite inlines `VITE_*` variables into the browser bundle. The function has no login in front of it, so it caps the input at 300 characters and the output at 1024 tokens. The free tier costs nothing but has per-project rate limits: a `429` from Gemini becomes `rate_limited`, which the form explains to the user. On the free tier Google may use the sentences to improve its products.

Rules for `api/`:

- Vercel deploys each file in `api/` on its own and does not bundle relative imports, so a function must not import from `src/` or from other files. It keeps its own copy of the categories; `api/_parse-transaction.test.ts` fails if it drifts from `src/data/categories.ts`.
- Vercel skips files that start with `_`, so tests in `api/` are named `_<name>.test.ts`. They run in the `node` environment (`// @vitest-environment node`).
- Functions export Web handlers (`export async function POST(request: Request): Promise<Response>`).
- Log the error reason only, never the user's sentence: it contains financial data.

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
- `src/hooks/` - `useTransactions` (state, persistence, totals, add/update/remove/replace), `useSettings` (name and savings goal) and `useSpeechRecognition` (voice entry)
- `src/lib/` - Pure helpers: `analytics` (monthly totals, cash flow, expense shares, savings goal), `transactionFilters` (URL filters and filtering), `storage` (localStorage with validation), `backup` (export/import JSON), `voiceTransaction` (voice entry client and validation), `profile`, `date`, `format`, `id`, `cx`
- `api/` - Vercel Functions (see Voice Entry)
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

Voice entry tests never touch a real microphone or the network: `TransactionFormModal.test.tsx` stubs `webkitSpeechRecognition` with a fake that the test drives (`hear`, `finish`, `fail`) and stubs `fetch` with `vi.stubGlobal`.
