# Nexo

Personal finance dashboard. React + Vite + TypeScript with CSS Modules, originally exported from Figma Make and now run locally (the Figma Make plugins and Tailwind were removed).

## Development Server

Uses **npm** (Node 24). No server is started automatically.

- `npm install` - Install dependencies
- `npm run dev` - Start the Vite dev server at http://localhost:5173 with hot reload
- `npm run typecheck` - Run `tsc --noEmit`
- `npm test` - Run the Vitest suite once (`npm run test:watch` to keep it running)
- `npm run build` - Type-check, then build to `dist/`

## Project Structure

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx`
- `src/App.tsx` - App shell: sidebar, topbar, current page and the new-transaction modal; owns `useTransactions`, search and mobile-menu state
- `src/pages/` - One component per screen (`Dashboard.tsx` for now)
- `src/components/ui/` - Generic building blocks: `Icon`, `Button`, `IconButton`, `Modal`, `FormField`/`FormRow`, `Panel`/`PanelHeading`, `SearchInput`, `Eyebrow`
- `src/components/layout/` - `Sidebar` (with `NavItem`, `GoalCard`, `ProfileCard`) and `Topbar`
- `src/components/dashboard/` - `BalanceCard`, `MetricCard`, `CashflowChart`, `ExpensesByCategory`
- `src/components/transactions/` - `TransactionList`, `TransactionRow`, `FilterTabs`, `TransactionFormModal`
- `src/hooks/useTransactions.ts` - Transactions state, persistence, totals, add/update/remove
- `src/lib/` - Pure helpers: `analytics` (monthly totals, cash flow, expense shares, savings goal), `storage` (localStorage with validation), `date`, `format`, `id`, `cx`
- `src/data/` - Static data: categories (color tone and which transaction type each one allows), sample transactions generated relative to today, current user and monthly savings goal
- `src/types/` - Shared TypeScript types
- `src/styles/reset.css` - Base reset (copy of Tailwind v4 Preflight) inside `@layer base`
- `src/index.css` - Fonts, reset import, color tokens on `:root`, `body` defaults

## Conventions

- Import across folders with the `@/` alias (`@/components/ui/Button`).
- Components receive data through props; formatting lives in `src/lib/format.ts`, calculations in `src/lib/analytics.ts`.
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

Vitest + Testing Library (jsdom), configured in `vite.config.ts` with `src/test/setup.ts` (clears localStorage and cleans up between tests). Tests sit next to the code (`*.test.ts(x)`). Query by role, label or text, not by CSS class: module class names are hashed. `src/App.test.tsx` covers the main user flows with a fixed transaction set and a fixed date (`vi.useFakeTimers({ toFake: ["Date"] })` + `vi.setSystemTime`), so only `Date` is faked and user-event keeps working.
