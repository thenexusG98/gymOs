import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <Loader2 className={cn('animate-spin text-gym-orange', sizeMap[size], className)} />
  )
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <Spinner size="lg" />
    </div>
  )
}
