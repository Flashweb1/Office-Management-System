import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCollection } from '@/hooks/useFirestore'
import { formatCurrency, formatChartCurrency, formatChartValue } from '@/lib/utils'
import { Download, BarChart3, TrendingUp, DollarSign } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'
import type { Shipment, Expense } from '@/types'

export function ReportsPage() {
  const { data: shipments } = useCollection<Shipment>('shipments')
  const { data: expenses } = useCollection<Expense>('expenses')

  const totalRevenue = (shipments || []).reduce((s, sh) => s + (sh.revenue || 0), 0)
  const totalCost = (shipments || []).reduce((s, sh) => s + (sh.cost || 0), 0)
  const totalProfit = totalRevenue - totalCost
  const totalExpenses = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0)

  const profitByLane = (shipments || []).reduce<Record<string, number>>((acc, s) => {
    if (s.lane) {
      acc[s.lane] = (acc[s.lane] || 0) + ((s.revenue || 0) - (s.cost || 0))
    }
    return acc
  }, {})

  const laneChartData = Object.entries(profitByLane)
    .map(([lane, profit]) => ({ lane, profit }))
    .sort((a, b) => b.profit - a.profit)

  const expenseChartData = (expenses || []).reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + (e.amount || 0)
    return acc
  }, {})

  const expenseBreakdown = Object.entries(expenseChartData).map(([category, amount]) => ({ category, amount }))

  const monthlyPnl = [
    { month: 'All Time', revenue: totalRevenue, cost: totalCost, profit: totalProfit },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Financial and operational analytics.</p>
        </div>
        <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export Report</Button>
      </div>

      <div className="grid gap-4 grid-cols-4">
        <Card>
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><DollarSign className="w-4 h-4" /> Revenue</div>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><BarChart3 className="w-4 h-4" /> Cost</div>
            <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingUp className="w-4 h-4" /> Gross Profit</div>
            <p className="text-2xl font-bold text-success">{formatCurrency(totalProfit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><BarChart3 className="w-4 h-4" /> Gross Margin</div>
            <p className="text-2xl font-bold">{totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0'}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Profit & Loss</CardTitle>
              {totalProfit > 0 && <Badge variant="success">Profitable</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyPnl}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatChartValue(v)} />
                  <Tooltip formatter={(v) => formatChartCurrency(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(221 83% 53%)" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="cost" stroke="hsl(0 84% 60%)" strokeWidth={2} name="Cost" />
                  <Line type="monotone" dataKey="profit" stroke="hsl(142 71% 45%)" strokeWidth={2} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Profit by Lane</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={laneChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                  <XAxis type="number" tickFormatter={(v) => formatChartValue(v)} />
                  <YAxis dataKey="lane" type="category" width={90} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatChartCurrency(v)} />
                  <Bar dataKey="profit" fill="hsl(221 83% 53%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Expenses</CardTitle></CardHeader>
          <CardContent>
            {expenseBreakdown.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No expenses recorded.</p>
            ) : (
              <div className="space-y-3">
                {expenseBreakdown.map((e) => (
                  <div key={e.category} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{e.category.replace('_', ' ')}</span>
                        <span className="text-muted-foreground">{formatCurrency(e.amount)}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${totalExpenses > 0 ? (e.amount / totalExpenses) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
