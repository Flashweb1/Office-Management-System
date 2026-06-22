import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  trend?: number
  trendLabel?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const variantBorder = {
  default: 'border-l-primary',
  success: 'border-l-success',
  warning: 'border-l-warning',
  danger: 'border-l-destructive',
}

export function StatCard({ title, value, trend, trendLabel, variant = 'default' }: StatCardProps) {
  return (
    <Card className={cn('border-l-4', variantBorder[variant])}>
      <CardContent className="p-4 lg:p-5">
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1 text-xs">
            {trend >= 0 ? (
              <TrendingUp className="w-3 h-3 text-success" />
            ) : (
              <TrendingDown className="w-3 h-3 text-destructive" />
            )}
            <span className={trend >= 0 ? 'text-success' : 'text-destructive'}>
              {Math.abs(trend)}%
            </span>
            {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
