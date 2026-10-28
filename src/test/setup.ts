import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach } from "vitest"

// O jsdom não implementa rolagem; o <ScrollRestoration> do React Router a chama ao navegar.
window.scrollTo = () => {}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

afterEach(() => {
  cleanup()
})
