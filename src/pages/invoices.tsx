import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { InvoiceForm } from '@/components/forms/invoice-form'
import { PageHeader } from '@/components/ui/page-header'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useCollection } from '@/hooks/useFirestore'
import { useFirestoreMutation } from '@/hooks/useFirestoreMutation'
import { Search, Download, MoreHorizontal, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import type { Invoice } from '@/types'

export function InvoicesPage() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const { data: invoices, isLoading } = useCollection<Invoice>('invoices', {
    orderByFilter: ['createdAt', 'desc'],
  })
  const { add, remove } = useFirestoreMutation<Invoice>('invoices')
  const navigate = useNavigate()

  const filtered = (invoices || []).filter((inv) =>
    inv.id?.toLowerCase().includes(search.toLowerCase()) ||
    inv.customerName?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = (data: any) => {
    add({
      customerId: data.customerId || '',
      customerName: data.customerName,
      amount: Number(data.amount),
      dueDate: data.dueDate,
      paid: data.status === 'paid',
      shipmentId: data.shipmentId || null,
      createdAt: new Date().toISOString(),
    })
    setShowForm(false)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    remove(deleteTarget.id)
    setDeleteTarget(null)
  }

  const totalPending = (invoices || []).filter(i => !i.paid).reduce((s, i) => s + (i.amount || 0), 0)
  const totalCollected = (invoices || []).filter(i => i.paid).reduce((s, i) => s + (i.amount || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Manage billing and payments." actionLabel="New Invoice" onAction={() => setShowForm(true)} />

      <div className="grid gap-4 grid-cols-4">
        <StatCard title="Total Invoices" value={String(invoices?.length || 0)} />
        <StatCard title="Outstanding" value={formatCurrency(totalPending)} variant="warning" />
        <StatCard title="Overdue" value={formatCurrency((invoices || []).filter(i => !i.paid).reduce((s, i) => s + (i.amount || 0), 0))} variant="danger" />
        <StatCard title="Collected" value={formatCurrency(totalCollected)} variant="success" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Invoices</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search invoices..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Button variant="outline" size="sm"><Download className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-1">No invoices found</p>
              <p className="text-sm">{search ? 'Try a different search.' : 'Click "New Invoice" to create one.'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.id}</TableCell>
                    <TableCell>{inv.customerName}</TableCell>
                    <TableCell>{formatCurrency(inv.amount || 0)}</TableCell>
                    <TableCell>{inv.dueDate || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={inv.paid ? 'success' : 'warning'}>{inv.paid ? 'Paid' : 'Pending'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => setMenuOpen(menuOpen === inv.id ? null : inv.id)}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        {menuOpen === inv.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                            <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-md border bg-card shadow-lg">
                              {inv.paid && (
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" onClick={() => { navigate(`/invoices/${inv.id}/receipt`); setMenuOpen(null) }}>
                                  <Download className="w-3.5 h-3.5" /> Receipt
                                </button>
                              )}
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent" onClick={() => { setDeleteTarget(inv); setMenuOpen(null) }}>
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InvoiceForm open={showForm} onClose={() => setShowForm(false)} onSubmit={handleAdd} />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Invoice" message={`Delete ${deleteTarget?.id}?`} confirmLabel="Delete" />
    </div>
  )
}
