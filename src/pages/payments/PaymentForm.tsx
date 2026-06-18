import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { paymentsService } from '@/services/payments'
import { studentsService } from '@/services/students'
import { plansService } from '@/services/plans'
import { useAuthStore } from '@/store/authStore'
import type { Student, Plan } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { generateReceipt } from '@/utils/pdfGenerator'
import { today } from '@/utils/dateUtils'

const schema = z.object({
  student_id: z.coerce.number().min(1, 'Selecciona un alumno'),
  plan_id: z.coerce.number().min(1, 'Selecciona un plan'),
  amount: z.coerce.number().min(0.01, 'Importe inválido'),
  payment_date: z.string().min(1, 'Requerido'),
  payment_method: z.string().min(1, 'Selecciona un método'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface PaymentFormProps {
  preSelectedStudentId?: number
  onClose: () => void
  onSuccess: () => void
}

export default function PaymentForm({ preSelectedStudentId, onClose, onSuccess }: PaymentFormProps) {
  const user = useAuthStore((s) => s.user)
  const [students, setStudents] = useState<Student[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [printAfter, setPrintAfter] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      student_id: preSelectedStudentId ?? 0,
      plan_id: 0,
      amount: 0,
      payment_date: today(),
      payment_method: 'cash',
      notes: '',
    },
  })

  useEffect(() => {
    Promise.all([
      studentsService.getAll(undefined, 'active'),
      plansService.getAll(false),
    ]).then(([s, p]) => {
      setStudents(s)
      setPlans(p)
    })
  }, [])

  // Auto-fill amount when plan is selected
  const planId = watch('plan_id')
  useEffect(() => {
    const plan = plans.find((p) => p.id === Number(planId))
    if (plan) setValue('amount', plan.price)
  }, [planId, plans, setValue])

  const onSubmit = async (data: FormData) => {
    try {
      const payment = await paymentsService.create({
        student_id: data.student_id,
        plan_id: data.plan_id,
        amount: data.amount,
        payment_date: data.payment_date,
        payment_method: data.payment_method,
        notes: data.notes || undefined,
        created_by: user?.id,
      })
      toast.success('Pago registrado')
      if (printAfter) generateReceipt(payment)
      onSuccess()
    } catch (e) {
      toast.error(String(e))
    }
  }

  const studentOptions = students.map((s) => ({ value: s.id, label: s.full_name }))
  const planOptions = plans.map((p) => ({ value: p.id, label: `${p.name} — $${p.price}` }))
  const methodOptions = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'transfer', label: 'Transferencia' },
    { value: 'card', label: 'Tarjeta' },
  ]

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Registrar pago"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button form="payment-form" type="submit" loading={isSubmitting}>
            Registrar pago
          </Button>
        </>
      }
    >
      <form id="payment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Alumno *"
          options={studentOptions}
          placeholder="Seleccionar alumno..."
          error={errors.student_id?.message}
          disabled={!!preSelectedStudentId}
          {...register('student_id')}
        />
        <Select
          label="Plan *"
          options={planOptions}
          placeholder="Seleccionar plan..."
          error={errors.plan_id?.message}
          {...register('plan_id')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Importe (MXN) *"
            type="number"
            step="0.01"
            min="0"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Input
            label="Fecha de pago *"
            type="date"
            error={errors.payment_date?.message}
            {...register('payment_date')}
          />
        </div>
        <Select
          label="Método de pago *"
          options={methodOptions}
          error={errors.payment_method?.message}
          {...register('payment_method')}
        />
        <Textarea
          label="Notas"
          placeholder="Observaciones del pago..."
          {...register('notes')}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={printAfter}
            onChange={(e) => setPrintAfter(e.target.checked)}
            className="accent-gym-orange w-4 h-4"
          />
          <span className="text-sm text-gym-text-secondary">Generar recibo PDF al guardar</span>
        </label>
      </form>
    </Modal>
  )
}
