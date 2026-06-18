import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { expensesService } from '@/services/expenses'
import type { Expense } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { today } from '@/utils/dateUtils'

const schema = z.object({
  date: z.string().min(1, 'Requerido'),
  concept: z.string().min(2, 'Mínimo 2 caracteres'),
  category: z.string().min(1, 'Selecciona una categoría'),
  amount: z.coerce.number().min(0.01, 'El importe debe ser mayor a 0'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ExpenseFormProps {
  expense: Expense | null
  onClose: () => void
  onSuccess: () => void
}

const categoryOptions = [
  { value: 'rent', label: 'Renta' },
  { value: 'electricity', label: 'Luz' },
  { value: 'water', label: 'Agua' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'cleaning', label: 'Limpieza' },
  { value: 'equipment', label: 'Equipamiento' },
  { value: 'other', label: 'Otros' },
]

export default function ExpenseForm({ expense, onClose, onSuccess }: ExpenseFormProps) {
  const isEditing = !!expense

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: today(),
      concept: '',
      category: '',
      amount: 0,
      notes: '',
    },
  })

  useEffect(() => {
    if (expense) {
      reset({
        date: expense.date,
        concept: expense.concept,
        category: expense.category,
        amount: expense.amount,
        notes: expense.notes ?? '',
      })
    }
  }, [expense, reset])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing) {
        await expensesService.update({
          id: expense.id,
          date: data.date,
          concept: data.concept,
          category: data.category,
          amount: data.amount,
          notes: data.notes || undefined,
        })
        toast.success('Gasto actualizado')
      } else {
        await expensesService.create({
          date: data.date,
          concept: data.concept,
          category: data.category,
          amount: data.amount,
          notes: data.notes || undefined,
        })
        toast.success('Gasto registrado')
      }
      onSuccess()
    } catch (e) {
      toast.error(String(e))
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEditing ? 'Editar gasto' : 'Nuevo gasto'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button form="expense-form" type="submit" loading={isSubmitting}>
            {isEditing ? 'Guardar' : 'Registrar gasto'}
          </Button>
        </>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha *"
            type="date"
            error={errors.date?.message}
            {...register('date')}
          />
          <Input
            label="Importe (MXN) *"
            type="number"
            step="0.01"
            min="0"
            error={errors.amount?.message}
            {...register('amount')}
          />
        </div>
        <Input
          label="Concepto *"
          placeholder="Descripción del gasto"
          error={errors.concept?.message}
          {...register('concept')}
        />
        <Select
          label="Categoría *"
          options={categoryOptions}
          placeholder="Seleccionar categoría..."
          error={errors.category?.message}
          {...register('category')}
        />
        <Textarea
          label="Notas"
          placeholder="Información adicional..."
          {...register('notes')}
        />
      </form>
    </Modal>
  )
}
