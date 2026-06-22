import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useDocument } from '@/hooks/useFirestore'
import { useCollection } from '@/hooks/useFirestore'
import { useFirestoreMutation } from '@/hooks/useFirestoreMutation'
import { useToastStore } from '@/store/toastStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Send } from 'lucide-react'
import type { Customer, Shipment, Invoice, ContactLog } from '@/types'

export function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'shipments' | 'invoices' | 'contact'>('shipments')
  const [newNote, setNewNote] = useState('')
  const addToast = useToastStore((s) => s.addToast)

  const { data: customer, isLoading: customerLoading } = useDocument<Customer>('customers', id)
  const { data: shipments } = useCollection<Shipment>('shipments', { whereFilters: [['customerId', '==', id!]], orderByFilter: ['createdAt', 'desc'] })
  const { data: invoices } = useCollection<Invoice>('invoices', { whereFilters: [['customerId', '==', id!]], orderByFilter: ['createdAt', 'desc'] })
  const { data: contactLogs } = useCollection<ContactLog>('contactLogs', { whereFilters: [['customerId', '==', id!]], orderByFilter: ['createdAt', 'desc'] })
  const { add } = useFirestoreMutation('contactLogs')

  const handleAddNote = () => {
    if (!newNote.trim() || !id) return
    add({
      customerId: id,
      userId: 'current-user',
      userName: 'Current User',
      type: 'note',
      note: newNote.trim(),
    })
    setNewNote('')
    addToast('Note added', 'success')
  }

  if (customerLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-md" />
          <div><Skeleton className="h-8 w-48 mb-1" /><Skeleton className="h-4 w-32" /></div>
        </div>
        <div className="grid gap-4 grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!customer) {
    return <div className="text-center py-12 text-muted-foreground">Customer not found.</div>
  }

  const totalRevenue = (shipments || []).reduce((sum, s) => sum + (s.revenue || 0), 0)
  const totalProfit = (shipments || []).reduce((sum, s) => sum + ((s.revenue || 0) - (s.cost || 0)), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/customers')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{customer.companyName}</h1>
          <p className="text-muted-foreground">Customer since {customer.createdAt ? formatDate(customer.createdAt) : 'N/A'}</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Contact" value={customer.contactPerson || 'N/A'} />
        <StatCard title="Phone" value={customer.phone || 'N/A'} />
        <StatCard title="Email" value={customer.email || 'N/A'} />
        <StatCard title="Payment Terms" value={customer.paymentTerms || 'N/A'} />
      </div>

      <div className="grid gap-4 grid-cols-4">
        <StatCard title="Credit Limit" value={formatCurrency(customer.creditLimit)} />
        <StatCard title="Current Balance" value={formatCurrency(customer.balance || 0)}
          variant={(customer.balance || 0) / (customer.creditLimit || 1) > 0.8 ? 'danger' : 'warning'} />
        <StatCard title="Lifetime Revenue" value={formatCurrency(totalRevenue)} variant="success" />
        <StatCard title="Lifetime Profit" value={formatCurrency(totalProfit)} variant={totalProfit >= 0 ? 'success' : 'danger'} />
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex gap-4">
            {(['shipments', 'invoices', 'contact'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`text-sm font-medium pb-1 border-b-2 transition-colors capitalize ${
                  activeTab === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                }`}>
                {tab} ({tab === 'shipments' ? shipments?.length || 0 : tab === 'invoices' ? invoices?.length || 0 : contactLogs?.length || 0})
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {activeTab === 'shipments' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Lane</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(shipments || []).length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No shipments yet.</TableCell></TableRow>
                ) : (shipments || []).map((s) => {
                  const profit = (s.revenue || 0) - (s.cost || 0)
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.id}</TableCell>
                      <TableCell>{s.lane}</TableCell>
                      <TableCell>{s.pickupDate ? formatDate(s.pickupDate) : '-'}</TableCell>
                      <TableCell>{s.deliveryDate ? formatDate(s.deliveryDate) : '-'}</TableCell>
                      <TableCell>{formatCurrency(s.revenue || 0)}</TableCell>
                      <TableCell>{formatCurrency(s.cost || 0)}</TableCell>
                      <TableCell className={profit >= 0 ? 'text-success' : 'text-destructive'}>{formatCurrency(profit)}</TableCell>
                      <TableCell><Badge variant={s.status === 'delivered' ? 'success' : s.status === 'delayed' ? 'danger' : 'warning'}>{s.status?.replace('_', ' ')}</Badge></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {activeTab === 'invoices' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(invoices || []).length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No invoices yet.</TableCell></TableRow>
                ) : (invoices || []).map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.id}</TableCell>
                    <TableCell>{formatCurrency(inv.amount || 0)}</TableCell>
                    <TableCell>{inv.dueDate ? formatDate(inv.dueDate) : '-'}</TableCell>
                    <TableCell><Badge variant={inv.paid ? 'success' : 'warning'}>{inv.paid ? 'Paid' : 'Pending'}</Badge></TableCell>
                    <TableCell>{inv.paidDate ? formatDate(inv.paidDate) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {activeTab === 'contact' && (
            <div className="p-6">
              <div className="space-y-4">
                {(contactLogs || []).length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No contact logs yet.</p>
                ) : (contactLogs || []).map((log) => (
                  <div key={log.id} className="flex gap-3 pb-4 border-b last:border-0">
                    <div className="w-2 h-2 rounded-full mt-2 shrink-0 bg-primary" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{log.userName}</span>
                        <Badge variant="outline" className="text-[10px]">{log.type}</Badge>
                        <span className="text-xs text-muted-foreground ml-auto">{log.createdAt ? formatDate(log.createdAt) : ''}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{log.note}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Input placeholder="Add a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} className="flex-1" />
                <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}><Send className="w-3.5 h-3.5 mr-1" /> Add</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
