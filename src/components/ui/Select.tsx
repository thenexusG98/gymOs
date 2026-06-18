import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SelectOption {
  value: string | number
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gym-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-gym-surface2 border rounded-lg pl-3 pr-9 py-2 text-sm text-gym-text appearance-none',
              'focus:outline-none focus:ring-2 focus:ring-gym-orange/40 focus:border-gym-orange/60',
              'transition-colors duration-150 cursor-pointer',
              error ? 'border-red-500/60' : 'border-gym-border',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gym-text-secondary pointer-events-none" />
        </div>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
