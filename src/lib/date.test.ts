import { describe, expect, it } from "vitest"
import { isISODate, parseISODate, toISODate } from "@/lib/date"

describe("toISODate", () => {
  it("usa o dia local, mesmo tarde da noite", () => {
    // Com toISOString(), 22h30 no Brasil (UTC-3) viraria o dia seguinte.
    expect(toISODate(new Date(2025, 4, 14, 22, 30))).toBe("2025-05-14")
  })

  it("completa mês e dia com zero", () => {
    expect(toISODate(new Date(2025, 0, 5))).toBe("2025-01-05")
  })
})

describe("parseISODate", () => {
  it("lê a data como meio-dia local", () => {
    const date = parseISODate("2025-05-08")
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2025, 4, 8, 12])
  })
})

describe("isISODate", () => {
  it.each(["2025-05-14", "2024-02-29"])("aceita %s", (value) => {
    expect(isISODate(value)).toBe(true)
  })

  it.each(["14/05/2025", "2025-5-14", "ontem", "", 20250514, null])("recusa %s", (value) => {
    expect(isISODate(value)).toBe(false)
  })
})
