import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variantClasses = {
  primary:
    'bg-gym-orange hover:bg-gym-orange-hover text-white shadow-sm shadow-gym-orange/20',
  secondary:
    'bg-gym-surface2 hover:bg-gym-border text-gym-text border border-gym-border',
  danger:
    'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30',
  ghost:
    'bg-transparent hover:bg-gym-surface2 text-gym-text-secondary hover:text-gym-text',
  outline:
    'bg-transparent border border-gym-orange text-gym-orange hover:bg-gym-orange hover:text-white',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base rounded-xl gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, disabled, children, ...props },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gym-orange/50 disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
      {children}
    </button>
  )
)

Button.displayName = 'Button'
export default Button
