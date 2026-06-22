import { useCollection } from './useFirestore'
import type { Shipment, Customer, Invoice, Alert, Driver } from '@/types'

interface BusinessContextResult {
  context: string
  isLoading: boolean
  error: string | null
}

export function useBusinessContext(): BusinessContextResult {
  const { data: shipments, isLoading: sLoad } = useCollection<Shipment>('shipments')
  const { data: customers, isLoading: cLoad } = useCollection<Customer>('customers')
  const { data: invoices, isLoading: iLoad } = useCollection<Invoice>('invoices')
  const { data: alerts, isLoading: aLoad } = useCollection<Alert>('alerts')
  const { data: drivers, isLoading: dLoad } = useCollection<Driver>('drivers')

  const isLoading = sLoad || cLoad || iLoad || aLoad || dLoad

  if (isLoading) {
    return { context: '', isLoading, error: null }
  }

  try {
    const lines: string[] = []

    const total = shipments?.length || 0
    const inTransit = (shipments || []).filter(s => s.status === 'in_transit').length
    const delivered = (shipments || []).filter(s => s.status === 'delivered').length
    const delayed = (shipments || []).filter(s => s.status === 'delayed').length
    const cancelled = (shipments || []).filter(s => s.status === 'cancelled').length

    const revenue = (shipments || []).reduce((s, sh) => s + (sh.revenue || 0), 0)
    const cost = (shipments || []).reduce((s, sh) => s + (sh.cost || 0), 0)
    const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0

    const negativeMargin = (shipments || []).filter(s => (s.revenue || 0) - (s.cost || 0) < 0).length

    lines.push('=== SHIPMENTS ===', '')
    lines.push(`Total shipments: ${total}`)
    lines.push(`In transit: ${inTransit}`)
    lines.push(`Delivered: ${delivered}`)
    lines.push(`Delayed: ${delayed}`)
    lines.push(`Cancelled: ${cancelled}`)
    lines.push(`Revenue MTD: $${revenue.toLocaleString()}`)
    lines.push(`Cost MTD: $${cost.toLocaleString()}`)
    lines.push(`Gross margin: ${margin.toFixed(1)}%`)
    lines.push(`Shipments with negative margin: ${negativeMargin}`)
    lines.push('')

    const uniqueLanes = [...new Set((shipments || []).map(s => s.lane).filter(Boolean))]
    if (uniqueLanes.length > 0) {
      lines.push('Lanes:')
      uniqueLanes.forEach((lane) => {
        const laneShipments = (shipments || []).filter(s => s.lane === lane)
        const laneRev = laneShipments.reduce((s, sh) => s + (sh.revenue || 0), 0)
        const laneCost = laneShipments.reduce((s, sh) => s + (sh.cost || 0), 0)
        const laneMargin = laneRev > 0 ? ((laneRev - laneCost) / laneRev) * 100 : 0
        lines.push(`- ${lane}: ${laneShipments.length} shipments, ${laneMargin.toFixed(1)}% margin`)
      })
      lines.push('')
    }

    lines.push('=== CUSTOMERS ===', '')
    const totalCustomers = customers?.length || 0
    const onHold = (customers || []).filter(c => c.onHold).length
    lines.push(`Total customers: ${totalCustomers}`)
    lines.push(`On hold: ${onHold}`)
    const custBalances = (customers || []).reduce((s, c) => s + (c.balance || 0), 0)
    lines.push(`Total outstanding balance: $${custBalances.toLocaleString()}`)
    lines.push('')

    lines.push('=== INVOICES ===', '')
    const totalInvoices = invoices?.length || 0
    const paid = (invoices || []).filter(i => i.paid).length
    const unpaid = (invoices || []).filter(i => !i.paid).length
    const overdue = (invoices || []).filter(i => !i.paid).reduce((s, i) => s + (i.amount || 0), 0)
    const collected = (invoices || []).filter(i => i.paid).reduce((s, i) => s + (i.amount || 0), 0)
    lines.push(`Total invoices: ${totalInvoices}`)
    lines.push(`Paid: ${paid}`)
    lines.push(`Unpaid: ${unpaid}`)
    lines.push(`Overdue amount: $${overdue.toLocaleString()}`)
    lines.push(`Collected: $${collected.toLocaleString()}`)
    lines.push('')

    const topOverdue = (invoices || [])
      .filter(i => !i.paid)
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 3)
    if (topOverdue.length > 0) {
      lines.push('Top overdue customers:')
      topOverdue.forEach(i => {
        lines.push(`- ${i.customerName || 'Unknown'}: $${(i.amount || 0).toLocaleString()}`)
      })
      lines.push('')
    }

    lines.push('=== ALERTS ===', '')
    const unresolved = (alerts || []).filter(a => !a.resolved)
    lines.push(`Unresolved alerts: ${unresolved.length}`)
    unresolved.slice(0, 5).forEach(a => {
      lines.push(`- [${a.type}] ${a.message}`)
    })
    lines.push('')

    lines.push('=== FLEET ===', '')
    const available = (drivers || []).filter(d => d.status === 'available').length
    const onTrip = (drivers || []).filter(d => d.status === 'on_trip').length
    const offDuty = (drivers || []).filter(d => d.status === 'off_duty').length
    lines.push(`Available drivers: ${available}`)
    lines.push(`On trip: ${onTrip}`)
    lines.push(`Off duty: ${offDuty}`)

    return { context: lines.join('\n'), isLoading: false, error: null }
  } catch (err) {
    return { context: '', isLoading: false, error: 'Failed to build business context.' }
  }
}
