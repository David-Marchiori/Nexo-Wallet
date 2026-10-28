import { useId, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/Button"
import { FormField, FormRow } from "@/components/ui/FormField"
import { Modal, ModalActions } from "@/components/ui/Modal"
import { categoriesFor } from "@/data/categories"
import { toISODate } from "@/lib/date"
import type { Category, NewTransaction, Transaction, TransactionType } from "@/types/transaction"

type TransactionFormModalProps = {
  /** Transação a editar; sem ela, o formulário cria uma nova. */
  transaction?: Transaction
  onClose: () => void
  onSubmit: (transaction: NewTransaction) => void
}

export function TransactionFormModal({ transaction, onClose, onSubmit }: TransactionFormModalProps) {
  const id = useId()
  const editing = transaction !== undefined
  const initialType = transaction?.type ?? "expense"
  const [type, setType] = useState<TransactionType>(initialType)
  const [category, setCategory] = useState<Category>(() =>
    transaction && categoriesFor(initialType).includes(transaction.category)
      ? transaction.category
      : categoriesFor(initialType)[0],
  )
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
      title: String(form.get("title")).trim(),
      category,
      type,
      amount: Number(form.get("amount")),
      date: String(form.get("date")),
    })
  }

  return (
    <Modal
      eyebrow={editing ? "EDITAR LANÇAMENTO" : "NOVO LANÇAMENTO"}
      title={editing ? "Editar transação" : "Adicionar transação"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <FormField label="Descrição" htmlFor={`${id}-title`}>
          <input
            id={`${id}-title`}
            name="title"
            placeholder="Ex: Compra no mercado"
            defaultValue={transaction?.title}
            required
            autoFocus
          />
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
              defaultValue={transaction?.amount}
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
            <input
              id={`${id}-date`}
              name="date"
              type="date"
              defaultValue={transaction?.date ?? toISODate(new Date())}
              required
            />
          </FormField>
        </FormRow>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          {editing ? (
            <Button type="submit">Salvar alterações</Button>
          ) : (
            <Button type="submit" icon="plus">
              Adicionar transação
            </Button>
          )}
        </ModalActions>
      </form>
    </Modal>
  )
}
