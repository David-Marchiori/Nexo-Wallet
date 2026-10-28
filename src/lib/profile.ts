function words(name: string): string[] {
  return name.trim().split(/\s+/).filter(Boolean)
}

/** `Marina Alves` → `Marina` */
export function firstNameOf(name: string): string {
  return words(name)[0] ?? ""
}

/** `Marina Alves` → `MA`; `Marina` → `M`; usa o primeiro e o último nome. */
export function initialsOf(name: string): string {
  const parts = words(name)
  if (parts.length === 0) return ""
  const picked = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : [parts[0]]
  return picked.map((part) => part[0]).join("").toUpperCase()
}
