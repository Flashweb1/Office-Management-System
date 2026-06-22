import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { StaffForm } from '@/components/forms/staff-form'
import { PageHeader } from '@/components/ui/page-header'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useCollection } from '@/hooks/useFirestore'
import { useFirestoreMutation } from '@/hooks/useFirestoreMutation'
import { useToastStore } from '@/store/toastStore'
import { Search, Mail, Phone, MoreHorizontal, Edit3, Trash2, UserCheck } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import type { Staff, User } from '@/types'

const ROLES = [
  { value: 'CEO', label: 'CEO' },
  { value: 'OPS_MANAGER', label: 'Ops Manager' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'SALES', label: 'Sales' },
  { value: 'SUPPORT', label: 'Support' },
]

export function StaffPage() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [approveTarget, setApproveTarget] = useState<User | null>(null)
  const [approveRole, setApproveRole] = useState('SALES')
  const [approving, setApproving] = useState(false)
  const addToast = useToastStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const { data: staff, isLoading } = useCollection<Staff>('staff', {
    orderByFilter: ['hireDate', 'desc'],
  })
  const { data: pendingUsers } = useCollection<User>('users', {
    whereFilters: [['role', '==', 'PENDING']],
  })
  const { add, update, remove } = useFirestoreMutation<Staff>('staff')

  const filtered = (staff || []).filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase()) ||
    s.position?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = (data: any) => {
    add({
      userId: data.userId || '',
      name: data.name,
      email: data.email,
      phone: data.phone,
      position: data.position,
      department: data.department,
      salary: Number(data.salary),
      hireDate: data.hireDate,
      status: 'active',
    })
    setShowForm(false)
  }

  const handleEdit = (data: any) => {
    if (!editingStaff) return
    update({
      id: editingStaff.id,
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        position: data.position,
        department: data.department,
        salary: Number(data.salary),
        hireDate: data.hireDate,
      },
    })
    setEditingStaff(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    remove(deleteTarget.id)
    setDeleteTarget(null)
  }

  const handleApprove = async () => {
    if (!approveTarget) return
    setApproving(true)
    try {
      await updateDoc(doc(db, 'users', approveTarget.id), { role: approveRole })
      addToast(`${approveTarget.name} approved as ${ROLES.find(r => r.value === approveRole)?.label}`, 'success')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setApproveTarget(null)
    } catch (err: any) {
      addToast(err.message || 'Failed to approve user', 'error')
    } finally {
      setApproving(false)
    }
  }

  const activeStaff = (staff || []).filter((s) => s.status === 'active').length
  const totalPayroll = (staff || []).filter(s => s.status === 'active').reduce((sum, s) => sum + (s.salary || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Staff" description="Manage your team members." actionLabel="Add Staff" onAction={() => setShowForm(true)} />

      <div className="grid gap-4 grid-cols-3">
        <StatCard title="Total Staff" value={String(staff?.length || 0)} />
        <StatCard title="Active" value={String(activeStaff)} variant="success" />
        <StatCard title="Monthly Payroll" value={`$${(totalPayroll / 12 / 1000).toFixed(0)}k`} />
      </div>

      {pendingUsers && pendingUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              Pending Approvals
              <Badge variant="warning">{pendingUsers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-40"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                          {u.name?.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell><Badge variant="warning">Pending</Badge></TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => { setApproveTarget(u); setApproveRole('SALES') }}>
                        <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Staff</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search staff..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-1">No staff found</p>
              <p className="text-sm">{search ? 'Try a different search.' : 'Click "Add Staff" to get started.'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                          {s.name?.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">Hired {s.hireDate}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{s.position}</TableCell>
                    <TableCell>{s.department}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a href={`mailto:${s.email}`} className="text-muted-foreground hover:text-foreground"><Mail className="w-3.5 h-3.5" /></a>
                        <a href={`tel:${s.phone}`} className="text-muted-foreground hover:text-foreground"><Phone className="w-3.5 h-3.5" /></a>
                      </div>
                    </TableCell>
                    <TableCell>${s.salary?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'active' ? 'success' : 'warning'}>{s.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => setMenuOpen(menuOpen === s.id ? null : s.id)}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        {menuOpen === s.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                            <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-md border bg-card shadow-lg">
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" onClick={() => { setEditingStaff(s); setMenuOpen(null) }}><Edit3 className="w-3.5 h-3.5" /> Edit</button>
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent" onClick={() => { setDeleteTarget(s); setMenuOpen(null) }}><Trash2 className="w-3.5 h-3.5" /> Delete</button>
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

      <StaffForm open={showForm} onClose={() => setShowForm(false)} onSubmit={handleAdd} />
      {editingStaff && (
        <StaffForm
          open={!!editingStaff}
          onClose={() => setEditingStaff(null)}
          onSubmit={handleEdit}
          initial={{
            name: editingStaff.name,
            email: editingStaff.email,
            phone: editingStaff.phone,
            position: editingStaff.position,
            department: editingStaff.department,
            salary: String(editingStaff.salary),
            hireDate: editingStaff.hireDate,
          }}
        />
      )}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Remove Staff" message={`Remove ${deleteTarget?.name} from the system?`} confirmLabel="Remove" />

      <Dialog open={!!approveTarget} onClose={() => setApproveTarget(null)} title="Approve User" description={`Assign a role for ${approveTarget?.name}`}>
        <DialogContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Role</label>
            <Select value={approveRole} onChange={(e) => setApproveRole(e.target.value)} options={ROLES} />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setApproveTarget(null)}>Cancel</Button>
          <Button onClick={handleApprove} disabled={approving}>
            {approving ? 'Approving...' : 'Approve'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}