/**
 * Gera um id único. `crypto.randomUUID` só existe em contexto seguro
 * (https ou localhost), então há um fallback para quando o app é aberto
 * pelo IP da rede, por exemplo ao testar no celular.
 */
export function createId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()

  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}
