import { cn } from '@/utils/cn'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'orange'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gym-surface2 text-gym-text-secondary border-gym-border',
  success: 'bg-green-500/15 text-green-400 border-green-500/30',
  warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  danger: 'bg-red-500/15 text-red-400 border-red-500/30',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  orange: 'bg-gym-orange/15 text-gym-orange border-gym-orange/30',
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export const paymentStatusBadge = (status: string) => {
  const map: Record<string, BadgeVariant> = {
    current: 'success',
    expiring: 'warning',
    overdue: 'danger',
    no_payment: 'info',
  }
  const labels: Record<string, string> = {
    current: 'Al corriente',
    expiring: 'Por vencer',
    overdue: 'Vencido',
    no_payment: 'Sin pago',
  }
  return { variant: map[status] ?? 'default', label: labels[status] ?? status }
}

export const studentStatusBadge = (status: string) => {
  const map: Record<string, BadgeVariant> = {
    active: 'success',
    suspended: 'warning',
    inactive: 'danger',
  }
  const labels: Record<string, string> = {
    active: 'Activo',
    suspended: 'Suspendido',
    inactive: 'Baja',
  }
  return { variant: map[status] ?? 'default', label: labels[status] ?? status }
}
