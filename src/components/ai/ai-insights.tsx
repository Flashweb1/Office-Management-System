import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, RefreshCw, X, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react'
import { useBusinessContext } from '@/hooks/useBusinessContext'
import { generateAIResponse } from '@/services/ai'

interface Insight {
  icon: 'alert' | 'trend-up' | 'trend-down' | 'info'
  title: string
  message: string
}

function parseInsights(raw: string): Insight[] {
  const lines = raw.split('\n').filter(Boolean)
  const insights: Insight[] = []
  let current: Partial<Insight> = {}

  for (const line of lines) {
    const trimmed = line.replace(/^[\s•*\-]+/, '').trim()
    if (!trimmed) continue

    if (/^⚠|alert|risk|danger/i.test(trimmed)) {
      if (current.title) {
        insights.push(current as Insight)
      }
      current = { icon: 'alert', title: trimmed.replace(/^[⚠️\s]+/, '').split('—')[0]?.trim() || trimmed, message: trimmed }
    } else if (/^📈|up|growth|improve/i.test(trimmed) && !current.title) {
      if (current.title) {
        insights.push(current as Insight)
      }
      current = { icon: 'trend-up', title: trimmed.replace(/^[📈\s]+/, '').split('—')[0]?.trim() || trimmed, message: trimmed }
    } else if (/^📉|down|decline|drop/i.test(trimmed) && !current.title) {
      if (current.title) {
        insights.push(current as Insight)
      }
      current = { icon: 'trend-down', title: trimmed.replace(/^[📉\s]+/, '').split('—')[0]?.trim() || trimmed, message: trimmed }
    } else if (current.title) {
      current.message += '\n' + trimmed
    } else {
      if (current.title) insights.push(current as Insight)
      current = { icon: 'info', title: trimmed, message: trimmed }
    }
  }
  if (current.title) insights.push(current as Insight)

  return insights.slice(0, 4)
}

const IconMap = {
  'alert': AlertTriangle,
  'trend-up': TrendingUp,
  'trend-down': TrendingDown,
  'info': Info,
}

const ColorMap = {
  'alert': 'border-l-destructive',
  'trend-up': 'border-l-success',
  'trend-down': 'border-l-warning',
  'info': 'border-l-primary',
}

export function AIInsights() {
  const { context, isLoading: ctxLoading } = useBusinessContext()
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())
  const [hasGenerated, setHasGenerated] = useState(false)

  const generate = useCallback(async () => {
    if (!context) return
    setLoading(true)
    try {
      const res = await generateAIResponse(
        'Analyze this logistics data. Return 2-3 concise, actionable insights. Format as:\n' +
        '⚠️ [Title] — [Finding with numbers] — [Recommendation]\n' +
        '📈 [Title] — [Positive finding with numbers]\n' +
        '📉 [Title] — [Negative finding with numbers]',
        context,
      )
      setInsights(parseInsights(res.text))
      setHasGenerated(true)
    } catch {
      // silently fail — insights are non-critical
    } finally {
      setLoading(false)
    }
  }, [context])

  useEffect(() => {
    if (context && !hasGenerated && !ctxLoading) {
      generate()
    }
  }, [context, hasGenerated, ctxLoading, generate])

  const visibleInsights = insights.filter((_, i) => !dismissed.has(i))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <CardTitle className="text-base">AI Insights</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={generate}
          disabled={loading || ctxLoading}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {(loading || ctxLoading) && !hasGenerated ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-4 h-4 rounded mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleInsights.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {hasGenerated ? 'No actionable insights right now.' : 'Add more business data to get AI-powered insights.'}
          </p>
        ) : (
          <div className="space-y-3">
            {visibleInsights.map((insight, i) => {
              const Icon = IconMap[insight.icon]
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-md border-l-4 bg-muted/30 ${ColorMap[insight.icon]}`}
                >
                  <Icon className="w-4 h-4 mt-0.5 shrink-0 text-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{insight.message}</p>
                  </div>
                  <button
                    onClick={() => setDismissed(prev => new Set(prev).add(i))}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
