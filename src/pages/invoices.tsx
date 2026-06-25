import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { InvoiceForm } from '@/components/forms/invoice-form'
import { PageHeader } from '@/components/ui/page-header'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useCollection } from '@/hooks/useFirestore'
import { useFirestoreMutation } from '@/hooks/useFirestoreMutation'
import { useToastStore } from '@/store/toastStore'
import { Search, Download, MoreHorizontal, Edit3, Trash2, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import type { Invoice } from '@/types'

export function InvoicesPage() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null)
  const [payTarget, setPayTarget] = useState<Invoice | null>(null)
  const [payRef, setPayRef] = useState('')
  const [paying, setPaying] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const addToast = useToastStore((s) => s.addToast)
  const queryClient = useQueryClient()

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
      paidDate: data.status === 'paid' ? new Date().toISOString() : null,
      paymentRef: data.status === 'paid' ? payRef || null : null,
      shipmentId: data.shipmentId || null,
      createdAt: new Date().toISOString(),
    })
    setShowForm(false)
  }

  const handleEdit = async (data: any) => {
    if (!editingInvoice) return
    try {
      await updateDoc(doc(db, 'invoices', editingInvoice.id), {
        customerName: data.customerName,
        amount: Number(data.amount),
        dueDate: data.dueDate,
        paid: data.status === 'paid',
        paidDate: data.status === 'paid' ? (editingInvoice.paidDate || new Date().toISOString()) : null,
        shipmentId: data.shipmentId || null,
      })
      addToast('Invoice updated successfully.', 'success')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    } catch (err: any) {
      addToast(err.message || 'Failed to update invoice.', 'error')
    }
    setEditingInvoice(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    remove(deleteTarget.id)
    setDeleteTarget(null)
  }

  const handleMarkPaid = async () => {
    if (!payTarget) return
    setPaying(true)
    try {
      await updateDoc(doc(db, 'invoices', payTarget.id), {
        paid: true,
        paidDate: new Date().toISOString(),
        paymentRef: payRef || null,
      })
      addToast(`Invoice ${payTarget.id} marked as paid.`, 'success')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setPayTarget(null)
      setPayRef('')
    } catch (err: any) {
      addToast(err.message || 'Failed to mark as paid.', 'error')
    } finally {
      setPaying(false)
    }
  }

  const totalPending = (invoices || []).filter(i => !i.paid).reduce((s, i) => s + (i.amount || 0), 0)
  const overdue = (invoices || []).filter(i => !i.paid && i.dueDate && new Date(i.dueDate) < new Date())
  const totalOverdue = overdue.reduce((s, i) => s + (i.amount || 0), 0)
  const totalCollected = (invoices || []).filter(i => i.paid).reduce((s, i) => s + (i.amount || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Manage billing and payments." actionLabel="New Invoice" onAction={() => setShowForm(true)} />

      <div className="grid gap-4 grid-cols-4">
        <StatCard title="Total Invoices" value={String(invoices?.length || 0)} />
        <StatCard title="Outstanding" value={formatCurrency(totalPending)} variant="warning" />
        <StatCard title="Overdue" value={formatCurrency(totalOverdue)} variant="danger" />
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
                      {inv.paid ? (
                        <Badge variant="success">Paid</Badge>
                      ) : inv.dueDate && new Date(inv.dueDate) < new Date() ? (
                        <Badge variant="danger">Overdue</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
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
                              {!inv.paid && (
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" onClick={() => { setPayTarget(inv); setPayRef(''); setMenuOpen(null) }}>
                                  <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
                                </button>
                              )}
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" onClick={() => { setEditingInvoice(inv); setMenuOpen(null) }}>
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                              </button>
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
      {editingInvoice && (
        <InvoiceForm
          open={!!editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSubmit={handleEdit}
          initial={{
            customerName: editingInvoice.customerName,
            amount: String(editingInvoice.amount),
            dueDate: editingInvoice.dueDate,
            status: editingInvoice.paid ? 'paid' : 'pending',
            shipmentId: editingInvoice.shipmentId || '',
          }}
        />
      )}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Invoice" message={`Delete ${deleteTarget?.id}?`} confirmLabel="Delete" />

      <Dialog open={!!payTarget} onClose={() => setPayTarget(null)} title="Mark Invoice as Paid" description={`Record payment for ${payTarget?.id}`}>
        <DialogContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Payment Reference (optional)</label>
            <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Check #1234 / Wire Ref" />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPayTarget(null)}>Cancel</Button>
          <Button onClick={handleMarkPaid} disabled={paying}>
            {paying ? 'Processing...' : 'Mark as Paid'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}