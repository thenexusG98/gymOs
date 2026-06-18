import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { plansService } from '@/services/plans'
import type { Plan } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  price: z.coerce.number().min(0.01, 'El precio debe ser mayor a 0'),
  duration_days: z.coerce.number().int().min(1, 'Mínimo 1 día'),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface PlanFormProps {
  plan: Plan | null
  onClose: () => void
  onSuccess: () => void
}

export default function PlanForm({ plan, onClose, onSuccess }: PlanFormProps) {
  const isEditing = !!plan

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      price: 0,
      duration_days: 30,
      description: '',
      is_active: true,
    },
  })

  useEffect(() => {
    if (plan) {
      reset({
        name: plan.name,
        price: plan.price,
        duration_days: plan.duration_days,
        description: plan.description ?? '',
        is_active: plan.is_active,
      })
    }
  }, [plan, reset])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing) {
        await plansService.update({
          id: plan.id,
          name: data.name,
          price: data.price,
          duration_days: data.duration_days,
          description: data.description || undefined,
          is_active: data.is_active ?? true,
        })
        toast.success('Plan actualizado')
      } else {
        await plansService.create({
          name: data.name,
          price: data.price,
          duration_days: data.duration_days,
          description: data.description || undefined,
        })
        toast.success('Plan creado')
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
      title={isEditing ? 'Editar plan' : 'Nuevo plan'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button form="plan-form" type="submit" loading={isSubmitting}>
            {isEditing ? 'Guardar cambios' : 'Crear plan'}
          </Button>
        </>
      }
    >
      <form id="plan-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre del plan *"
          placeholder="Ej: Mensualidad libre"
          error={errors.name?.message}
          {...register('name')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Precio (MXN) *"
            type="number"
            step="0.01"
            min="0"
            placeholder="500.00"
            error={errors.price?.message}
            {...register('price')}
          />
          <Input
            label="Duración (días) *"
            type="number"
            min="1"
            placeholder="30"
            error={errors.duration_days?.message}
            {...register('duration_days')}
          />
        </div>
        <Textarea
          label="Descripción"
          placeholder="Descripción del plan..."
          {...register('description')}
        />
        {isEditing && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('is_active')}
              className="accent-gym-orange w-4 h-4"
            />
            <span className="text-sm text-gym-text-secondary">Plan activo</span>
          </label>
        )}
      </form>
    </Modal>
  )
}
