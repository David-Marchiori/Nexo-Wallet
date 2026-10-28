import { Icon } from "@/components/ui/Icon"
import { cx } from "@/lib/cx"
import styles from "./SearchInput.module.css"

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  return (
    <label className={cx(styles.box, className)}>
      <Icon name="search" size={18} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}
