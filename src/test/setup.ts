import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach } from "vitest"

// Os testes das funções da Vercel (pasta api/) rodam no ambiente "node", sem DOM.
const hasDom = typeof window !== "undefined"

// O jsdom não implementa rolagem; o <ScrollRestoration> do React Router a chama ao navegar.
if (hasDom) window.scrollTo = () => {}

beforeEach(() => {
  if (!hasDom) return
  localStorage.clear()
  sessionStorage.clear()
})

afterEach(() => {
  if (hasDom) cleanup()
})
