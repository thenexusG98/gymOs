import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gym-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-gym-surface2 border rounded-lg px-3 py-2 text-sm text-gym-text placeholder-gym-text-secondary/60',
            'focus:outline-none focus:ring-2 focus:ring-gym-orange/40 focus:border-gym-orange/60',
            'transition-colors duration-150',
            error
              ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30'
              : 'border-gym-border',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-400">{error}</span>}
        {hint && !error && <span className="text-xs text-gym-text-secondary">{hint}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
