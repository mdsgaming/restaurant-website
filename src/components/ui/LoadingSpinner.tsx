import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div
      className={cn(
        'border-2 border-current border-t-transparent rounded-full animate-spin',
        sizes[size],
        className
      )}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-cream">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" className="text-primary mx-auto" />
        <p className="text-sm text-charcoal/60 font-serif italic">Loading…</p>
      </div>
    </div>
  )
}

export function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <LoadingSpinner size="md" className="text-primary" />
    </div>
  )
}
