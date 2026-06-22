import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline'
  className?: string
  children: React.ReactNode
}

const variantStyles = {
  default: 'bg-primary/10 text-primary border-transparent',
  success: 'bg-success/10 text-success border-transparent',
  warning: 'bg-warning/10 text-warning border-transparent',
  danger: 'bg-destructive/10 text-destructive border-transparent',
  outline: 'text-foreground border-border',
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
