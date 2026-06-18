import { cn } from '@/utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export default function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-gym-surface border border-gym-border rounded-xl p-5',
        onClick && 'cursor-pointer hover:border-gym-orange/40 transition-colors',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)}>{children}</div>
  )
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-gym-text text-sm">{children}</h3>
}
