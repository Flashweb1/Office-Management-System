import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TimeOffForm } from '@/components/forms/time-off-form'
import { PageHeader } from '@/components/ui/page-header'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useCollection } from '@/hooks/useFirestore'
import { useFirestoreMutation } from '@/hooks/useFirestoreMutation'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { createNotification } from '@/lib/notifications'
import { MoreHorizontal, CheckCircle, XCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import type { TimeOff } from '@/types'

export function TimeOffPage() {
  const { user } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const { data: requests, isLoading } = useCollection<TimeOff>('time_off', {
    orderByFilter: ['createdAt', 'desc'],
  })
  const { add, remove } = useFirestoreMutation<TimeOff>('time_off')
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TimeOff | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const isCeo = user?.role === 'CEO'

  const handleAdd = (data: any) => {
    add({
      staffId: data.staffId || '',
      staffName: data.staffName,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
    setShowForm(false)
  }

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'time_off', id), { status: 'approved', approvedBy: user?.name || user?.email })
      queryClient.invalidateQueries({ queryKey: ['time_off'] })
      createNotification({
        userId: user?.id || '',
        title: 'Time-Off Approved',
        message: `A time-off request has been approved.`,
        type: 'success',
        link: '/time-off',
      })
      addToast('Request approved.', 'success')
    } catch (err: any) {
      addToast(err.message || 'Failed to approve.', 'error')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await updateDoc(doc(db, 'time_off', id), { status: 'rejected', approvedBy: user?.name || user?.email })
      queryClient.invalidateQueries({ queryKey: ['time_off'] })
      createNotification({
        userId: user?.id || '',
        title: 'Time-Off Rejected',
        message: `A time-off request has been rejected.`,
        type: 'warning',
        link: '/time-off',
      })
      addToast('Request rejected.', 'info')
    } catch (err: any) {
      addToast(err.message || 'Failed to reject.', 'error')
    }
  }

  const pending = (requests || []).filter(r => r.status === 'pending').length
  const approved = (requests || []).filter(r => r.status === 'approved').length

  return (
    <div className="space-y-6">
      <PageHeader title="Time Off" description="Manage time-off requests." actionLabel="New Request" onAction={() => setShowForm(true)} />

      <div className="grid gap-4 grid-cols-3">
        <StatCard title="Pending" value={String(pending)} variant="warning" />
        <StatCard title="Approved" value={String(approved)} variant="success" />
        <StatCard title="Total Requests" value={String(requests?.length || 0)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : (requests || []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-1">No time-off requests</p>
              <p className="text-sm">Click "New Request" to submit one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  {isCeo && <TableHead className="w-24">Actions</TableHead>}
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(requests || []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.staffName}</TableCell>
                    <TableCell>
                      <Badge variant={r.type === 'sick' ? 'danger' : r.type === 'vacation' ? 'success' : 'default'}>
                        {r.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.startDate} → {r.endDate}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{r.reason || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    {isCeo && (
                      <TableCell>
                        {r.status === 'pending' && (
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleApprove(r.id)}>
                              <CheckCircle className="w-3.5 h-3.5 text-success" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleReject(r.id)}>
                              <XCircle className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        )}
                        {r.status !== 'pending' && (
                          <span className="text-xs text-muted-foreground">{r.approvedBy ? `by ${r.approvedBy}` : '-'}</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => setMenuOpen(menuOpen === r.id ? null : r.id)}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        {menuOpen === r.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                            <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-md border bg-card shadow-lg">
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent" onClick={() => { setDeleteTarget(r); setMenuOpen(null) }}>
                                <XCircle className="w-3.5 h-3.5" /> Delete
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

      <TimeOffForm open={showForm} onClose={() => setShowForm(false)} onSubmit={handleAdd} />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) { remove(deleteTarget.id); setDeleteTarget(null) } }} title="Delete Request" message={`Delete this time-off request?`} confirmLabel="Delete" />
    </div>
  )
}