import { useEffect, useRef, useState } from "react"
import { IconButton } from "@/components/ui/IconButton"
import { cx } from "@/lib/cx"
import styles from "./ActionMenu.module.css"

export type ActionMenuItem = {
  label: string
  onSelect: () => void
  tone?: "danger"
}

type ActionMenuProps = {
  /** Nome do botão "⋯" para leitores de tela, ex.: "Opções de Aluguel". */
  label: string
  items: ActionMenuItem[]
}

/** Botão "⋯" que abre uma pequena lista de ações. Fecha ao escolher, ao clicar fora ou com Esc. */
export function ActionMenu({ label, items }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    listRef.current?.querySelector("button")?.focus()

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  return (
    <div className={styles.root} ref={rootRef}>
      <IconButton
        icon="more"
        label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      />
      {open && (
        <div className={styles.list} role="menu" aria-label={label} ref={listRef}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={cx(styles.item, item.tone === "danger" && styles.danger)}
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
