import { afterEach, describe, expect, it } from "vitest"
import { createId } from "@/lib/id"

const originalRandomUUID = crypto.randomUUID

describe("createId", () => {
  afterEach(() => {
    Object.defineProperty(crypto, "randomUUID", { value: originalRandomUUID, configurable: true })
  })

  it("gera ids únicos", () => {
    const ids = new Set(Array.from({ length: 5000 }, createId))
    expect(ids.size).toBe(5000)
  })

  it("funciona sem crypto.randomUUID (http pelo IP da rede)", () => {
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true })

    const ids = Array.from({ length: 5000 }, createId)

    expect(ids[0]).toMatch(/^[0-9a-f]{32}$/)
    expect(new Set(ids).size).toBe(5000)
  })
})
