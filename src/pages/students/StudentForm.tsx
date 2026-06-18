import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { studentsService } from '@/services/students'
import type { Student } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { today } from '@/utils/dateUtils'

const schema = z.object({
  full_name: z.string().min(2, 'Mínimo 2 caracteres'),
  phone: z.string().optional(),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  enrollment_date: z.string().min(1, 'Requerido'),
  birth_date: z.string().optional(),
  observations: z.string().optional(),
  status: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface StudentFormProps {
  student: Student | null
  onClose: () => void
  onSuccess: () => void
}

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'inactive', label: 'Baja' },
]

export default function StudentForm({ student, onClose, onSuccess }: StudentFormProps) {
  const isEditing = !!student

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      enrollment_date: today(),
      birth_date: '',
      observations: '',
      status: 'active',
    },
  })

  useEffect(() => {
    if (student) {
      reset({
        full_name: student.full_name,
        phone: student.phone ?? '',
        email: student.email ?? '',
        enrollment_date: student.enrollment_date,
        birth_date: student.birth_date ?? '',
        observations: student.observations ?? '',
        status: student.status,
      })
    }
  }, [student, reset])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing) {
        await studentsService.update({
          id: student.id,
          full_name: data.full_name,
          phone: data.phone || undefined,
          email: data.email || undefined,
          enrollment_date: data.enrollment_date,
          birth_date: data.birth_date || undefined,
          observations: data.observations || undefined,
          status: data.status ?? 'active',
        })
        toast.success('Alumno actualizado')
      } else {
        await studentsService.create({
          full_name: data.full_name,
          phone: data.phone || undefined,
          email: data.email || undefined,
          enrollment_date: data.enrollment_date,
          birth_date: data.birth_date || undefined,
          observations: data.observations || undefined,
        })
        toast.success('Alumno registrado')
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
      title={isEditing ? 'Editar alumno' : 'Nuevo alumno'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button form="student-form" type="submit" loading={isSubmitting}>
            {isEditing ? 'Guardar cambios' : 'Registrar alumno'}
          </Button>
        </>
      }
    >
      <form id="student-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre completo *"
          placeholder="Juan Pérez García"
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Teléfono"
            placeholder="555 123 4567"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="juan@email.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha de inscripción *"
            type="date"
            error={errors.enrollment_date?.message}
            {...register('enrollment_date')}
          />
          <Input
            label="Fecha de nacimiento"
            type="date"
            error={errors.birth_date?.message}
            {...register('birth_date')}
          />
        </div>
        {isEditing && (
          <Select
            label="Estado"
            options={statusOptions}
            error={errors.status?.message}
            {...register('status')}
          />
        )}
        <Textarea
          label="Observaciones"
          placeholder="Notas adicionales sobre el alumno..."
          {...register('observations')}
        />
      </form>
    </Modal>
  )
}
