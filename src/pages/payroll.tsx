import { useState } from 'react'
import { addDoc, collection, doc, writeBatch } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createNotification } from '@/lib/notifications'
import { StatCard } from '@/components/ui/stat-card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { PageHeader } from '@/components/ui/page-header'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useCollection } from '@/hooks/useFirestore'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { formatCurrency } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { PayrollRun, PayStub, Staff } from '@/types'

const DEDUCTION_RATES = {
  tax: 0.15,
  insurance: 0.04,
  retirement: 0.03,
  other: 0.01,
}

export function PayrollPage() {
  const { user } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const { data: runs, isLoading } = useCollection<PayrollRun>('payroll_runs', {
    orderByFilter: ['processedAt', 'desc'],
  })
  const { data: allStubs } = useCollection<PayStub>('pay_stubs')
  const { data: staff } = useCollection<Staff>('staff', {
    whereFilters: [['status', '==', 'active']],
  })

  const [showCreate, setShowCreate] = useState(false)
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [creating, setCreating] = useState(false)
  const [expandedRun, setExpandedRun] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PayrollRun | null>(null)

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !staff || staff.length === 0) {
      addToast('No active staff found to process payroll.', 'error')
      return
    }
    setCreating(true)
    try {
      const batch = writeBatch(db)
      const runRef = doc(collection(db, 'payroll_runs'))

      let totalGross = 0
      let totalDeductions = 0
      let totalNet = 0

      for (const s of staff) {
        const monthlyGross = (s.salary || 0) / 12
        const deductions = {
          tax: Math.round(monthlyGross * DEDUCTION_RATES.tax * 100) / 100,
          insurance: Math.round(monthlyGross * DEDUCTION_RATES.insurance * 100) / 100,
          retirement: Math.round(monthlyGross * DEDUCTION_RATES.retirement * 100) / 100,
          other: Math.round(monthlyGross * DEDUCTION_RATES.other * 100) / 100,
        }
        const totalDed = deductions.tax + deductions.insurance + deductions.retirement + deductions.other
        const netPay = Math.round((monthlyGross - totalDed) * 100) / 100

        totalGross += monthlyGross
        totalDeductions += totalDed
        totalNet += netPay

        const stubRef = doc(collection(db, 'pay_stubs'))
        batch.set(stubRef, {
          payrollRunId: runRef.id,
          staffId: s.id,
          staffName: s.name,
          grossPay: Math.round(monthlyGross * 100) / 100,
          deductions,
          netPay,
          hoursWorked: 160,
        })
      }

      batch.set(runRef, {
        periodStart,
        periodEnd,
        processedAt: new Date().toISOString(),
        status: 'processed',
        totalGross: Math.round(totalGross * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
        processedBy: user.name || user.email,
      })

      await batch.commit()
      queryClient.invalidateQueries({ queryKey: ['payroll_runs'] })
      queryClient.invalidateQueries({ queryKey: ['pay_stubs'] })
      createNotification({
        userId: user.id,
        title: 'Payroll Processed',
        message: `Payroll run ${periodStart} → ${periodEnd} processed for ${staff.length} employees.`,
        type: 'success',
        link: '/payroll',
        relatedTo: { collection: 'payroll_runs', id: runRef.id },
      })
      addToast(`Payroll run created for ${staff.length} employees.`, 'success')
      setShowCreate(false)
      setPeriodStart('')
      setPeriodEnd('')
    } catch (err: any) {
      addToast(err.message || 'Failed to process payroll.', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteRun = async () => {
    if (!deleteTarget) return
    try {
      const batch = writeBatch(db)
      batch.delete(doc(db, 'payroll_runs', deleteTarget.id))
      const relatedStubs = (allStubs || []).filter(s => s.payrollRunId === deleteTarget.id)
      for (const stub of relatedStubs) {
        batch.delete(doc(db, 'pay_stubs', stub.id))
      }
      await batch.commit()
      queryClient.invalidateQueries({ queryKey: ['payroll_runs'] })
      queryClient.invalidateQueries({ queryKey: ['pay_stubs'] })
      addToast('Payroll run deleted.', 'info')
    } catch (err: any) {
      addToast(err.message || 'Failed to delete.', 'error')
    }
    setDeleteTarget(null)
  }

  const runStubs = (allStubs || []).filter(s => s.payrollRunId === expandedRun)

  const totalProcessed = (runs || []).reduce((s, r) => s + r.totalNet, 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Payroll" description="Process payroll and manage pay stubs." actionLabel="New Payroll Run" onAction={() => setShowCreate(true)} />

      <div className="grid gap-4 grid-cols-4">
        <StatCard title="Payroll Runs" value={String(runs?.length || 0)} />
        <StatCard title="Total Paid" value={formatCurrency(totalProcessed)} variant="success" />
        <StatCard title="Active Staff" value={String(staff?.length || 0)} />
        <StatCard title="Monthly Gross" value={formatCurrency((staff || []).reduce((s, e) => s + (e.salary || 0) / 12, 0))} variant="warning" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payroll History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={4} cols={6} />
          ) : (runs || []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-1">No payroll runs yet</p>
              <p className="text-sm">Click "New Payroll Run" to process payroll.</p>
            </div>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(runs || []).map((run) => (
                    <>
                      <TableRow key={run.id} className="cursor-pointer" onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}>
                        <TableCell className="font-medium">{run.periodStart} → {run.periodEnd}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{new Date(run.processedAt).toLocaleDateString()}</TableCell>
                        <TableCell>{formatCurrency(run.totalGross)}</TableCell>
                        <TableCell className="text-destructive">{formatCurrency(run.totalDeductions)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(run.totalNet)}</TableCell>
                        <TableCell>
                          <Badge variant={run.status === 'processed' ? 'success' : 'warning'}>{run.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(run) }}>
                            {expandedRun === run.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedRun === run.id && (
                        <TableRow key={`${run.id}-stubs`}>
                          <TableCell colSpan={7} className="bg-muted/30 p-4">
                            <div className="rounded-md border bg-card">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Gross</TableHead>
                                    <TableHead>Tax</TableHead>
                                    <TableHead>Insurance</TableHead>
                                    <TableHead>Retirement</TableHead>
                                    <TableHead>Net Pay</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {runStubs.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground text-sm">No stubs found</TableCell></TableRow>
                                  ) : runStubs.map((stub) => (
                                    <TableRow key={stub.id}>
                                      <TableCell className="font-medium">{stub.staffName}</TableCell>
                                      <TableCell>{formatCurrency(stub.grossPay)}</TableCell>
                                      <TableCell className="text-destructive">{formatCurrency(stub.deductions.tax)}</TableCell>
                                      <TableCell>{formatCurrency(stub.deductions.insurance)}</TableCell>
                                      <TableCell>{formatCurrency(stub.deductions.retirement)}</TableCell>
                                      <TableCell className="font-medium">{formatCurrency(stub.netPay)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="New Payroll Run" description="Process payroll for all active staff.">
        <form onSubmit={handleCreateRun}>
          <DialogContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Period Start</label>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Period End</label>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
              </div>
            </div>
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
              <p>This will create pay stubs for <strong>{staff?.length || 0}</strong> active staff members.</p>
              <p className="text-xs mt-1">Deduction rates: Tax 15% · Insurance 4% · Retirement 3% · Other 1%</p>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" disabled={creating || !staff || staff.length === 0}>
              {creating ? 'Processing...' : `Process Payroll (${staff?.length || 0} employees)`}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteRun} title="Delete Payroll Run" message={`Delete this payroll run and all its pay stubs?`} confirmLabel="Delete" />
    </div>
  )
}