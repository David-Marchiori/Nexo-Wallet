import styles from "./FilterTabs.module.css"

type FilterTabsProps<T extends string> = {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

export function FilterTabs<T extends string>({ options, value, onChange }: FilterTabsProps<T>) {
  return (
    <div className={styles.tabs}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? styles.active : undefined}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
