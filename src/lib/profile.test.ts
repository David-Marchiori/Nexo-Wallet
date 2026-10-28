import { describe, expect, it } from "vitest"
import { firstNameOf, initialsOf } from "@/lib/profile"

describe("perfil", () => {
  it("pega o primeiro nome", () => {
    expect(firstNameOf("Marina Alves")).toBe("Marina")
    expect(firstNameOf("  Ana  ")).toBe("Ana")
  })

  it("monta as iniciais com o primeiro e o último nome", () => {
    expect(initialsOf("Marina Alves")).toBe("MA")
    expect(initialsOf("ana maria de souza")).toBe("AS")
    expect(initialsOf("Ágata")).toBe("Á")
    expect(initialsOf("   ")).toBe("")
  })
})
