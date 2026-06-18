import { Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  className,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gym-text-secondary" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gym-surface2 border border-gym-border rounded-lg pl-9 pr-8 py-2 text-sm text-gym-text placeholder-gym-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-gym-orange/40 focus:border-gym-orange/60 transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gym-text-secondary hover:text-gym-text"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
