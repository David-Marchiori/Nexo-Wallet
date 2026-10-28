import { useId, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/Button"
import { FormField, FormRow } from "@/components/ui/FormField"
import { Modal } from "@/components/ui/Modal"
import { categoriesFor } from "@/data/categories"
import { toISODate } from "@/lib/date"
import type { Category, NewTransaction, TransactionType } from "@/types/transaction"
import styles from "./TransactionFormModal.module.css"

type TransactionFormModalProps = {
  onClose: () => void
  onSubmit: (transaction: NewTransaction) => void
}

export function TransactionFormModal({ onClose, onSubmit }: TransactionFormModalProps) {
  const id = useId()
  const [type, setType] = useState<TransactionType>("expense")
  const [category, setCategory] = useState<Category>(categoriesFor("expense")[0])
  const availableCategories = categoriesFor(type)

  function handleTypeChange(nextType: TransactionType) {
    setType(nextType)
    const nextCategories = categoriesFor(nextType)
    if (!nextCategories.includes(category)) setCategory(nextCategories[0])
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSubmit({
      title: String(form.get("title")),
      category,
      type,
      amount: Number(form.get("amount")),
      date: String(form.get("date")),
    })
  }

  return (
    <Modal eyebrow="NOVO LANÇAMENTO" title="Adicionar transação" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Descrição" htmlFor={`${id}-title`}>
          <input id={`${id}-title`} name="title" placeholder="Ex: Compra no mercado" required autoFocus />
        </FormField>
        <FormRow>
          <FormField label="Tipo" htmlFor={`${id}-type`}>
            <select
              id={`${id}-type`}
              name="type"
              value={type}
              onChange={(event) => handleTypeChange(event.target.value as TransactionType)}
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </FormField>
          <FormField label="Valor" htmlFor={`${id}-amount`}>
            <input
              id={`${id}-amount`}
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0,00"
              required
            />
          </FormField>
        </FormRow>
        <FormRow>
          <FormField label="Categoria" htmlFor={`${id}-category`}>
            <select
              id={`${id}-category`}
              name="category"
              value={category}
              onChange={(event) => setCategory(event.target.value as Category)}
            >
              {availableCategories.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Data" htmlFor={`${id}-date`}>
            <input id={`${id}-date`} name="date" type="date" defaultValue={toISODate(new Date())} required />
          </FormField>
        </FormRow>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" icon="plus">
            Adicionar transação
          </Button>
        </div>
      </form>
    </Modal>
  )
}
