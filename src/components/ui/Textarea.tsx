import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gym-text-secondary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn(
            'w-full bg-gym-surface2 border rounded-lg px-3 py-2 text-sm text-gym-text placeholder-gym-text-secondary/60 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-gym-orange/40 focus:border-gym-orange/60',
            'transition-colors duration-150',
            error ? 'border-red-500/60' : 'border-gym-border',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
export default Textarea
