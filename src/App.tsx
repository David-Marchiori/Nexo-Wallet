import { FormEvent, useEffect, useMemo, useState } from "react"

type TransactionType = "income" | "expense"

type Transaction = {
  id: number
  title: string
  category: string
  type: TransactionType
  amount: number
  date: string
}

type IconName = "wallet" | "grid" | "swap" | "chart" | "target" | "settings" | "plus" | "arrowUp" | "arrowDown" | "eye" | "more" | "search" | "bell" | "chevron" | "close" | "calendar"

const iconPaths: Record<IconName, React.ReactNode> = {
  wallet: (
    <>
      <path d="M20 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v8a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7" />
      <path d="M16 14h.01" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  swap: (
    <>
      <path d="m7 7-3 3 3 3" />
      <path d="M4 10h12a4 4 0 0 1 4 4v1" />
      <path d="m17 17 3-3-3-3" />
      <path d="M20 14H8a4 4 0 0 1-4-4V9" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M22 19V3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-1.6-1H2v-4h.5a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.5 4a1.7 1.7 0 0 0 1-1.6V2h4v.4A1.7 1.7 0 0 0 15 4a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.6 1h1v4h-1a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrowUp: (
    <>
      <path d="m6 10 6-6 6 6" />
      <path d="M12 4v16" />
    </>
  ),
  arrowDown: (
    <>
      <path d="m6 14 6 6 6-6" />
      <path d="M12 20V4" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
}

function Icon({ name, size = 20 }: { name: IconName size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  )
}

const initialTransactions: Transaction[] = [
  {
    id: 1,
    title: "Salário",
    category: "Renda",
    type: "income",
    amount: 6500,
    date: "2025-05-05",
  },
  {
    id: 2,
    title: "Supermercado",
    category: "Alimentação",
    type: "expense",
    amount: 486.9,
    date: "2025-05-08",
  },
  {
    id: 3,
    title: "Projeto freelance",
    category: "Renda",
    type: "income",
    amount: 1850,
    date: "2025-05-11",
  },
  {
    id: 4,
    title: "Aluguel",
    category: "Moradia",
    type: "expense",
    amount: 2100,
    date: "2025-05-12",
  },
  {
    id: 5,
    title: "Spotify",
    category: "Assinaturas",
    type: "expense",
    amount: 21.9,
    date: "2025-05-13",
  },
]

const categoryColors: Record<string, string> = {
  Renda: "category-purple",
  Alimentação: "category-orange",
  Moradia: "category-blue",
  Assinaturas: "category-pink",
  Transporte: "category-green",
  Lazer: "category-yellow",
  Outros: "category-gray",
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})
const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
})

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("nexo-transactions")
    return saved ? JSON.parse(saved) : initialTransactions
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"all" | TransactionType>(
    "all",
  )
  const [search, setSearch] = useState("")
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [mobileNav, setMobileNav] = useState(false)

  useEffect(() => {
    localStorage.setItem("nexo-transactions", JSON.stringify(transactions))
  }, [transactions])

  const totals = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0)
    const expense = transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0)
    return { income, expense, balance: income - expense }
  }, [transactions])

  const filteredTransactions = transactions
    .filter((item) => activeFilter === "all" || item.type === activeFilter)
    .filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date))

  function addTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const next: Transaction = {
      id: Date.now(),
      title: String(form.get("title")),
      category: String(form.get("category")),
      type: form.get("type") as TransactionType,
      amount: Number(form.get("amount")),
      date: String(form.get("date")),
    }
    setTransactions((current) => [next, ...current])
    setIsModalOpen(false)
  }

  const displayMoney = (value: number) =>
    balanceVisible ? currency.format(value) : "R$ ••••••"

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Icon name="wallet" size={22} />
          </div>
          <span>Nexo</span>
          <button
            className="icon-button close-nav"
            onClick={() => setMobileNav(false)}
            aria-label="Fechar menu"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className="nav-list" aria-label="Navegação principal">
          <span className="nav-label">VISÃO GERAL</span>
          <button className="nav-item active">
            <Icon name="grid" />
            <span>Dashboard</span>
          </button>
          <button className="nav-item">
            <Icon name="swap" />
            <span>Transações</span>
          </button>
          <button className="nav-item">
            <Icon name="chart" />
            <span>Relatórios</span>
          </button>
          <span className="nav-label nav-section">PLANEJAMENTO</span>
          <button className="nav-item">
            <Icon name="target" />
            <span>Metas</span>
          </button>
          <button className="nav-item">
            <Icon name="settings" />
            <span>Configurações</span>
          </button>
        </nav>

        <div className="sidebar-card">
          <div className="sidebar-card-icon">
            <Icon name="target" />
          </div>
          <strong>Meta do mês</strong>
          <span>Você está no caminho certo.</span>
          <div className="progress">
            <i />
          </div>
          <small>68% concluído</small>
        </div>

        <div className="profile">
          <div className="avatar">MA</div>
          <div>
            <strong>Marina Alves</strong>
            <span>Conta pessoal</span>
          </div>
          <Icon name="more" />
        </div>
      </aside>

      {mobileNav && (
        <button
          className="nav-overlay"
          onClick={() => setMobileNav(false)}
          aria-label="Fechar menu"
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileNav(true)}
            aria-label="Abrir menu"
          >
            <Icon name="grid" />
          </button>
          <div className="greeting">
            <span>QUARTA, 14 DE MAIO</span>
            <h1>Olá, Marina.</h1>
            <p>Aqui está o resumo das suas finanças.</p>
          </div>
          <div className="top-actions">
            <label className="search-box">
              <Icon name="search" size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar transação"
              />
            </label>
            <button
              className="icon-button notification"
              aria-label="Notificações"
            >
              <Icon name="bell" />
              <i />
            </button>
            <button
              className="primary-button"
              onClick={() => setIsModalOpen(true)}
            >
              <Icon name="plus" size={18} /> Nova transação
            </button>
          </div>
        </header>

        <section className="summary-grid">
          <article className="balance-card">
            <div className="card-top">
              <span>Saldo disponível</span>
              <button
                className="ghost-button"
                onClick={() => setBalanceVisible((visible) => !visible)}
                aria-label="Mostrar ou ocultar saldo"
              >
                <Icon name="eye" size={18} />
              </button>
            </div>
            <strong>{displayMoney(totals.balance)}</strong>
            <div className="balance-footer">
              <span>
                <i className="dot-light" /> Conta principal
              </span>
              <span>+12,5% este mês</span>
            </div>
            <div className="glow glow-one" />
            <div className="glow glow-two" />
          </article>

          <article className="metric-card">
            <div className="metric-icon income-icon">
              <Icon name="arrowDown" />
            </div>
            <div className="metric-copy">
              <span>Receitas</span>
              <strong>{displayMoney(totals.income)}</strong>
              <small>
                <b>+8,2%</b> vs. mês anterior
              </small>
            </div>
            <button className="circle-link" aria-label="Ver receitas">
              <Icon name="chevron" size={17} />
            </button>
          </article>

          <article className="metric-card">
            <div className="metric-icon expense-icon">
              <Icon name="arrowUp" />
            </div>
            <div className="metric-copy">
              <span>Despesas</span>
              <strong>{displayMoney(totals.expense)}</strong>
              <small>
                <b className="negative">-3,4%</b> vs. mês anterior
              </small>
            </div>
            <button className="circle-link" aria-label="Ver despesas">
              <Icon name="chevron" size={17} />
            </button>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="panel cashflow-panel">
            <div className="panel-heading">
              <div>
                <h2>Fluxo de caixa</h2>
                <p>Receitas e despesas dos últimos 6 meses</p>
              </div>
              <button className="period-button">
                <Icon name="calendar" size={16} /> Últimos 6 meses
              </button>
            </div>
            <div className="chart-legend">
              <span>
                <i className="legend-income" /> Receitas
              </span>
              <span>
                <i className="legend-expense" /> Despesas
              </span>
            </div>
            <div className="bar-chart">
              {[42, 58, 48, 67, 76, 88].map((income, index) => (
                <div className="bar-group" key={income}>
                  <div className="bars">
                    <i
                      className="bar income-bar"
                      style={{ height: `${income}%` }}
                    />
                    <i
                      className="bar expense-bar"
                      style={{ height: `${[35, 44, 62, 45, 57, 49][index]}%` }}
                    />
                  </div>
                  <span>
                    {["Dez", "Jan", "Fev", "Mar", "Abr", "Mai"][index]}
                  </span>
                </div>
              ))}
              <div className="grid-line line-one" />
              <div className="grid-line line-two" />
              <div className="grid-line line-three" />
            </div>
          </article>

          <article className="panel expenses-panel">
            <div className="panel-heading">
              <div>
                <h2>Despesas por categoria</h2>
                <p>Distribuição deste mês</p>
              </div>
              <button className="ghost-button">
                <Icon name="more" />
              </button>
            </div>
            <div className="donut-wrap">
              <div className="donut">
                <div>
                  <strong>{currency.format(totals.expense)}</strong>
                  <span>Total gasto</span>
                </div>
              </div>
            </div>
            <div className="category-list">
              {[
                ["Moradia", "48%", "cat-purple"],
                ["Alimentação", "26%", "cat-lilac"],
                ["Assinaturas", "14%", "cat-pink"],
                ["Outros", "12%", "cat-gray"],
              ].map(([name, amount, color]) => (
                <div key={name}>
                  <span>
                    <i className={color} />
                    {name}
                  </span>
                  <strong>{amount}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel transactions-panel">
          <div className="panel-heading transaction-heading">
            <div>
              <h2>Transações recentes</h2>
              <p>Seus últimos lançamentos</p>
            </div>
            <div className="filter-tabs">
              {[
                ["all", "Todas"],
                ["income", "Receitas"],
                ["expense", "Despesas"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={activeFilter === value ? "active" : ""}
                  onClick={() =>
                    setActiveFilter(value as "all" | TransactionType)
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="transaction-list">
            {filteredTransactions.length ? (
              filteredTransactions.slice(0, 6).map((transaction) => (
                <div className="transaction-row" key={transaction.id}>
                  <div
                    className={`transaction-icon ${categoryColors[transaction.category] || "category-gray"}`}
                  >
                    <Icon
                      name={
                        transaction.type === "income" ? "arrowDown" : "arrowUp"
                      }
                      size={19}
                    />
                  </div>
                  <div className="transaction-name">
                    <strong>{transaction.title}</strong>
                    <span>{transaction.category}</span>
                  </div>
                  <span className="transaction-date">
                    {shortDate.format(new Date(`${transaction.date}T12:00:00`))}
                  </span>
                  <strong
                    className={
                      transaction.type === "income"
                        ? "amount-income"
                        : "amount-expense"
                    }
                  >
                    {transaction.type === "income" ? "+" : "-"}{" "}
                    {currency.format(transaction.amount)}
                  </strong>
                  <button className="ghost-button">
                    <Icon name="more" />
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">Nenhuma transação encontrada.</div>
            )}
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setIsModalOpen(false)}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span>NOVO LANÇAMENTO</span>
                <h2 id="modal-title">Adicionar transação</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar"
              >
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={addTransaction}>
              <div className="form-field">
                <label htmlFor="title">Descrição</label>
                <input
                  id="title"
                  name="title"
                  placeholder="Ex: Compra no mercado"
                  required
                  autoFocus
                />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="type">Tipo</label>
                  <select id="type" name="type" defaultValue="expense">
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="amount">Valor</label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="category">Categoria</label>
                  <select id="category" name="category">
                    {Object.keys(categoryColors).map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="date">Data</label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="primary-button">
                  <Icon name="plus" size={18} /> Adicionar transação
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
