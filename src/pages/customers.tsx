import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CustomerForm } from '@/components/forms/customer-form'
import { PageHeader } from '@/components/ui/page-header'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useCollection } from '@/hooks/useFirestore'
import { useFirestoreMutation } from '@/hooks/useFirestoreMutation'
import { Search, ExternalLink, MoreHorizontal, Edit3, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '@/lib/utils'
import type { Customer } from '@/types'

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const navigate = useNavigate()

  const { data: customers, isLoading } = useCollection<Customer>('customers', {
    orderByFilter: ['createdAt', 'desc'],
  })

  const { add, update, remove } = useFirestoreMutation<Customer>('customers')

  const filtered = (customers || []).filter((c) =>
    c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    c.contactPerson?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = (data: any) => {
    add({
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      creditLimit: Number(data.creditLimit),
      balance: 0,
      paymentTerms: data.paymentTerms,
      onHold: false,
      notes: data.notes,
    })
    setShowForm(false)
  }

  const handleEdit = (data: any) => {
    if (!editingCustomer) return
    update({
      id: editingCustomer.id,
      data: {
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        creditLimit: Number(data.creditLimit),
        paymentTerms: data.paymentTerms,
        notes: data.notes,
      },
    })
    setEditingCustomer(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    remove(deleteTarget.id)
    setDeleteTarget(null)
  }

  const totalAR = (customers || []).reduce((sum, c) => sum + (c.balance || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Manage client relationships and credit." actionLabel="Add Customer" onAction={() => setShowForm(true)} />

      <div className="grid gap-4 grid-cols-3">
        <StatCard title="Total Customers" value={String(customers?.length || 0)} />
        <StatCard title="Total AR" value={formatCurrency(totalAR)} variant="warning" />
        <StatCard title="On Credit Hold" value={String((customers || []).filter(c => c.onHold).length)} variant="danger" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Customers</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search customers..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-1">No customers found</p>
              <p className="text-sm">{search ? 'Try a different search.' : 'Click "Add Customer" to get started.'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const utilization = c.creditLimit > 0 ? (c.balance / c.creditLimit) * 100 : 0
                  return (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/customers/${c.id}`)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">{c.companyName?.charAt(0)}</div>
                          <div>
                            <p className="font-medium">{c.companyName}</p>
                            <p className="text-xs text-muted-foreground">{c.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{c.contactPerson}</TableCell>
                      <TableCell>{formatCurrency(c.creditLimit)}</TableCell>
                      <TableCell>{formatCurrency(c.balance)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full ${utilization > 90 ? 'bg-destructive' : utilization > 70 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${Math.min(utilization, 100)}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{utilization.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.onHold ? <Badge variant="danger">On Hold</Badge> : <Badge variant="success">Active</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="relative">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === c.id ? null : c.id) }}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                          {menuOpen === c.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(null) }} />
                              <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-md border bg-card shadow-lg">
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}`); setMenuOpen(null) }}><ExternalLink className="w-3.5 h-3.5" /> View</button>
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" onClick={(e) => { e.stopPropagation(); setEditingCustomer(c); setMenuOpen(null) }}><Edit3 className="w-3.5 h-3.5" /> Edit</button>
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent" onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); setMenuOpen(null) }}><Trash2 className="w-3.5 h-3.5" /> Delete</button>
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

      <CustomerForm open={showForm} onClose={() => setShowForm(false)} onSubmit={handleAdd} />
      {editingCustomer && (
        <CustomerForm
          open={!!editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSubmit={handleEdit}
          initial={{
            companyName: editingCustomer.companyName,
            contactPerson: editingCustomer.contactPerson,
            phone: editingCustomer.phone,
            email: editingCustomer.email,
            creditLimit: String(editingCustomer.creditLimit),
            paymentTerms: editingCustomer.paymentTerms,
            notes: editingCustomer.notes || '',
          }}
        />
      )}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Remove Customer" message={`Remove ${deleteTarget?.companyName} and all associated data?`} confirmLabel="Remove" />
    </div>
  )
}
