import { cn } from '@/utils/cn'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center gap-3',
        className
      )}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-gym-surface2 border border-gym-border flex items-center justify-center text-gym-text-secondary">
          {icon}
        </div>
      )}
      <div>
        <p className="font-medium text-gym-text">{title}</p>
        {description && (
          <p className="text-sm text-gym-text-secondary mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
