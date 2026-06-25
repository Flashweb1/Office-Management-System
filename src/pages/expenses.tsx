import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ExpenseForm } from '@/components/forms/expense-form'
import { PageHeader } from '@/components/ui/page-header'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useCollection } from '@/hooks/useFirestore'
import { useFirestoreMutation } from '@/hooks/useFirestoreMutation'
import { Search, MoreHorizontal, Edit3, Trash2, Receipt } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Expense } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  fuel: 'Fuel',
  maintenance: 'Maintenance',
  admin: 'Admin',
  tolls: 'Tolls',
  driver_pay: 'Driver Pay',
  other: 'Other',
}

const CATEGORY_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'outline'> = {
  fuel: 'warning',
  maintenance: 'danger',
  admin: 'default',
  tolls: 'outline',
  driver_pay: 'success',
  other: 'default',
}

export function ExpensesPage() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const { data: expenses, isLoading } = useCollection<Expense>('expenses', {
    orderByFilter: ['date', 'desc'],
  })
  const { add, update, remove } = useFirestoreMutation<Expense>('expenses')

  const filtered = (expenses || []).filter((e) =>
    e.description?.toLowerCase().includes(search.toLowerCase()) ||
    CATEGORY_LABELS[e.category]?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = (data: any) => {
    add({
      description: data.description,
      category: data.category,
      amount: Number(data.amount),
      date: data.date,
      shipmentId: data.shipmentId || null,
    })
    setShowForm(false)
  }

  const handleEdit = (data: any) => {
    if (!editingExpense) return
    update({
      id: editingExpense.id,
      data: {
        description: data.description,
        category: data.category,
        amount: Number(data.amount),
        date: data.date,
        shipmentId: data.shipmentId || null,
      },
    })
    setEditingExpense(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    remove(deleteTarget.id)
    setDeleteTarget(null)
  }

  const totalAmount = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0)
  const fuelTotal = (expenses || []).filter(e => e.category === 'fuel').reduce((s, e) => s + (e.amount || 0), 0)
  const maintTotal = (expenses || []).filter(e => e.category === 'maintenance').reduce((s, e) => s + (e.amount || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" description="Track all business expenses." actionLabel="Add Expense" onAction={() => setShowForm(true)} />

      <div className="grid gap-4 grid-cols-4">
        <StatCard title="Total Expenses" value={formatCurrency(totalAmount)} variant="danger" />
        <StatCard title="Fuel" value={formatCurrency(fuelTotal)} variant="warning" />
        <StatCard title="Maintenance" value={formatCurrency(maintTotal)} variant="danger" />
        <StatCard title="Transactions" value={String(expenses?.length || 0)} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Expenses</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search expenses..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-lg font-medium mb-1">No expenses found</p>
              <p className="text-sm">{search ? 'Try a different search.' : 'Click "Add Expense" to record one.'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Shipment</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground text-sm">{e.date ? formatDate(e.date) : '-'}</TableCell>
                    <TableCell className="font-medium">{e.description}</TableCell>
                    <TableCell>
                      <Badge variant={CATEGORY_VARIANTS[e.category] || 'default'}>
                        {CATEGORY_LABELS[e.category] || e.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.shipmentId || '-'}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(e.amount || 0)}</TableCell>
                    <TableCell>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => setMenuOpen(menuOpen === e.id ? null : e.id)}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        {menuOpen === e.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                            <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-md border bg-card shadow-lg">
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" onClick={() => { setEditingExpense(e); setMenuOpen(null) }}>
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent" onClick={() => { setDeleteTarget(e); setMenuOpen(null) }}>
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

      <ExpenseForm open={showForm} onClose={() => setShowForm(false)} onSubmit={handleAdd} />
      {editingExpense && (
        <ExpenseForm
          open={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          onSubmit={handleEdit}
          initial={{
            description: editingExpense.description,
            category: editingExpense.category,
            amount: String(editingExpense.amount),
            date: editingExpense.date,
            shipmentId: editingExpense.shipmentId || '',
          }}
        />
      )}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Expense" message={`Delete "${deleteTarget?.description}"?`} confirmLabel="Delete" />
    </div>
  )
}