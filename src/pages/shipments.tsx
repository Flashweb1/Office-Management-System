import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ShipmentForm } from '@/components/forms/shipment-form'
import { PageHeader } from '@/components/ui/page-header'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useCollection } from '@/hooks/useFirestore'
import { useFirestoreMutation } from '@/hooks/useFirestoreMutation'
import { Search, Filter, ExternalLink, MoreHorizontal, Edit3, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '@/lib/utils'
import type { Shipment } from '@/types'

const statusStyles: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
  delivered: 'success', delayed: 'danger', in_transit: 'warning', pending: 'default', cancelled: 'danger',
}

export function ShipmentsPage() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Shipment | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const navigate = useNavigate()

  const { data: shipments, isLoading } = useCollection<Shipment>('shipments', {
    orderByFilter: ['createdAt', 'desc'],
  })
  const { add, update, remove } = useFirestoreMutation<Shipment>('shipments')

  const filtered = (shipments || []).filter((s) =>
    s.id?.toLowerCase().includes(search.toLowerCase()) ||
    s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    s.lane?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = (data: any) => {
    add({
      customerName: data.customerName,
      lane: data.lane,
      pickupDate: data.pickupDate,
      deliveryDate: data.deliveryDate,
      revenue: Number(data.revenue),
      cost: Number(data.cost),
      status: data.status,
      notes: data.notes,
    })
    setShowForm(false)
  }

  const handleEdit = (data: any) => {
    if (!editingShipment) return
    update({
      id: editingShipment.id,
      data: {
        customerName: data.customerName,
        lane: data.lane,
        pickupDate: data.pickupDate,
        deliveryDate: data.deliveryDate,
        revenue: Number(data.revenue),
        cost: Number(data.cost),
        status: data.status,
        notes: data.notes,
      },
    })
    setEditingShipment(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    remove(deleteTarget.id)
    setDeleteTarget(null)
  }

  const totalRevenue = (shipments || []).reduce((sum, s) => sum + (s.revenue || 0), 0)
  const totalCost = (shipments || []).reduce((sum, s) => sum + (s.cost || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Shipments" description="Track and manage all shipments." actionLabel="New Shipment" onAction={() => setShowForm(true)} />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Shipments" value={String(shipments?.length || 0)} />
        <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} variant="success" />
        <StatCard title="Total Cost" value={formatCurrency(totalCost)} variant="warning" />
        <StatCard title="Gross Profit" value={formatCurrency(totalRevenue - totalCost)} variant={totalRevenue - totalCost >= 0 ? 'success' : 'danger'} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Shipments</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search shipments..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Button variant="outline" size="sm"><Filter className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} cols={10} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-1">No shipments found</p>
              <p className="text-sm">{search ? 'Try a different search.' : 'Click "New Shipment" to create one.'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Lane</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const profit = (s.revenue || 0) - (s.cost || 0)
                  return (
                    <TableRow key={s.id} className={`cursor-pointer ${profit < 0 ? 'bg-destructive/5' : ''}`} onClick={() => navigate(`/shipments/${s.id}`)}>
                      <TableCell className="font-medium">{s.id}</TableCell>
                      <TableCell>{s.customerName}</TableCell>
                      <TableCell>{s.lane}</TableCell>
                      <TableCell>{s.pickupDate || '-'}</TableCell>
                      <TableCell>{s.deliveryDate || '-'}</TableCell>
                      <TableCell>{formatCurrency(s.revenue || 0)}</TableCell>
                      <TableCell>{formatCurrency(s.cost || 0)}</TableCell>
                      <TableCell className={profit >= 0 ? 'text-success' : 'text-destructive font-medium'}>{formatCurrency(profit)}</TableCell>
                      <TableCell><Badge variant={statusStyles[s.status] || 'default'}>{s.status?.replace('_', ' ')}</Badge></TableCell>
                      <TableCell>
                        <div className="relative">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === s.id ? null : s.id) }}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                          {menuOpen === s.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(null) }} />
                              <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-md border bg-card shadow-lg">
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" onClick={(e) => { e.stopPropagation(); navigate(`/shipments/${s.id}`); setMenuOpen(null) }}><ExternalLink className="w-3.5 h-3.5" /> View</button>
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" onClick={(e) => { e.stopPropagation(); setEditingShipment(s); setMenuOpen(null) }}><Edit3 className="w-3.5 h-3.5" /> Edit</button>
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent" onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); setMenuOpen(null) }}><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ShipmentForm open={showForm} onClose={() => setShowForm(false)} onSubmit={handleAdd} />
      {editingShipment && (
        <ShipmentForm
          open={!!editingShipment}
          onClose={() => setEditingShipment(null)}
          onSubmit={handleEdit}
          initial={{
            customerName: editingShipment.customerName,
            lane: editingShipment.lane || '',
            pickupDate: editingShipment.pickupDate || '',
            deliveryDate: editingShipment.deliveryDate || '',
            revenue: String(editingShipment.revenue || 0),
            cost: String(editingShipment.cost || 0),
            status: editingShipment.status || 'pending',
            notes: editingShipment.notes || '',
          }}
        />
      )}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Shipment" message={`Delete ${deleteTarget?.id}? This cannot be undone.`} confirmLabel="Delete" />
    </div>
  )
}
