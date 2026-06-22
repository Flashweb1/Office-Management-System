import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { StatCardSkeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useCollection } from '@/hooks/useFirestore'
import { formatCurrency, formatChartCurrency, formatChartValue } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell,
} from 'recharts'
import type { Shipment, Customer, Invoice, Alert } from '@/types'
import { AIInsights } from '@/components/ai/ai-insights'

const AR_COLORS = ['hsl(142,71%,45%)', 'hsl(38,92%,50%)', 'hsl(28,92%,55%)', 'hsl(0,84%,60%)']

export function DashboardPage() {
  const { data: shipments, isLoading: shipmentsLoading } = useCollection<Shipment>('shipments')
  const { data: customers } = useCollection<Customer>('customers')
  const { data: invoices } = useCollection<Invoice>('invoices')
  const { data: alerts } = useCollection<Alert>('alerts', { whereFilters: [['resolved', '==', false]], limitCount: 5 })

  if (shipmentsLoading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Executive Dashboard</h1><p className="text-muted-foreground">Loading data...</p></div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  const totalRevenue = (shipments || []).reduce((s, sh) => s + (sh.revenue || 0), 0)
  const totalCost = (shipments || []).reduce((s, sh) => s + (sh.cost || 0), 0)
  const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
  const delivered = (shipments || []).filter(s => s.status === 'delivered').length
  const total = (shipments || []).length || 1
  const onTimePct = (delivered / total) * 100
  const arOverdue = (invoices || []).filter(i => !i.paid).reduce((s, i) => s + (i.amount || 0), 0)
  const openComplaints = (alerts || []).filter(a => a.type === 'complaint').length

  const profitByCustomer = (customers || []).map((c) => {
    const custShipments = (shipments || []).filter(s => s.customerName === c.companyName)
    const profit = custShipments.reduce((s, sh) => s + ((sh.revenue || 0) - (sh.cost || 0)), 0)
    return { name: c.companyName, profit }
  }).sort((a, b) => b.profit - a.profit)

  const profitChartData = [...profitByCustomer.slice(0, 5), ...profitByCustomer.slice(-2)]

  const revenueTrend = [
    { month: 'Jun', revenue: totalRevenue, cost: totalCost },
  ]

  const arAging = [
    { name: '0-30 days', value: arOverdue * 0.5 },
    { name: '31-60 days', value: arOverdue * 0.3 },
    { name: '61-90 days', value: arOverdue * 0.15 },
    { name: '90+ days', value: arOverdue * 0.05 },
  ]

  const negativeMarginShipments = (shipments || [])
    .filter(s => (s.revenue || 0) - (s.cost || 0) < 0)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
        <p className="text-muted-foreground">Real-time business health and performance overview.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Gross Margin" value={`${grossMargin.toFixed(1)}%`} variant={grossMargin < 15 ? 'danger' : grossMargin < 20 ? 'warning' : 'success'} />
        <StatCard title="Revenue" value={formatCurrency(totalRevenue)} variant="success" />
        <StatCard title="On-Time Delivery" value={`${onTimePct.toFixed(1)}%`} variant={onTimePct < 90 ? 'danger' : onTimePct < 95 ? 'warning' : 'success'} />
        <StatCard title="AR Overdue" value={formatCurrency(arOverdue)} variant={arOverdue > 50000 ? 'danger' : 'warning'} />
        <StatCard title="Open Complaints" value={String(openComplaints)} />
        <StatCard title="Customers" value={String(customers?.length || 0)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Revenue Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatChartValue(v)} />
                  <Tooltip formatter={(v) => formatChartCurrency(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(221 83% 53%)" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="cost" stroke="hsl(0 84% 60%)" strokeWidth={2} name="Cost" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">AR Aging</CardTitle></CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={arAging} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                    {arAging.map((_, i) => <Cell key={i} fill={AR_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatChartCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Profit by Customer</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                  <XAxis type="number" tickFormatter={(v) => formatChartValue(v)} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatChartCurrency(v)} />
                  <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                    {profitChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.profit >= 0 ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Alerts</CardTitle>
            <Badge variant="danger">{(alerts || []).filter(a => a.type === 'delay' || a.type === 'margin').length} active</Badge>
          </CardHeader>
          <CardContent>
            {(alerts || []).length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No alerts</p>
            ) : (
              <div className="space-y-3">
                {(alerts || []).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-destructive" />
                    <p className="text-sm">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AIInsights />

      {negativeMarginShipments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Negative Margin Shipments</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Loss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {negativeMarginShipments.map((s) => {
                  const loss = (s.revenue || 0) - (s.cost || 0)
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.id}</TableCell>
                      <TableCell>{s.customerName}</TableCell>
                      <TableCell>{formatCurrency(s.revenue || 0)}</TableCell>
                      <TableCell>{formatCurrency(s.cost || 0)}</TableCell>
                      <TableCell className="text-destructive font-medium">{formatCurrency(loss)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
