import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ReviewForm } from '@/components/forms/review-form'
import { PageHeader } from '@/components/ui/page-header'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useCollection } from '@/hooks/useFirestore'
import { useFirestoreMutation } from '@/hooks/useFirestoreMutation'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { MoreHorizontal, Edit3, Trash2, CheckCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import type { Review } from '@/types'

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Below Average',
  3: 'Meets Expectations',
  4: 'Exceeds Expectations',
  5: 'Outstanding',
}

export function ReviewsPage() {
  const { user } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const { data: reviews, isLoading } = useCollection<Review>('reviews', {
    orderByFilter: ['date', 'desc'],
  })
  const { add, remove } = useFirestoreMutation<Review>('reviews')
  const [showForm, setShowForm] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const handleAdd = (data: any) => {
    add({
      staffId: data.staffId || '',
      staffName: data.staffName,
      reviewerId: user?.id || '',
      reviewerName: user?.name || user?.email || 'Unknown',
      date: data.date,
      rating: Number(data.rating),
      strengths: data.strengths || '',
      improvements: data.improvements || '',
      goals: data.goals || '',
      status: 'completed',
    })
    setShowForm(false)
  }

  const handleEdit = (data: any) => {
    if (!editingReview) return
    const ref = doc(db, 'reviews', editingReview.id)
    updateDoc(ref, {
      staffName: data.staffName,
      date: data.date,
      rating: Number(data.rating),
      strengths: data.strengths || '',
      improvements: data.improvements || '',
      goals: data.goals || '',
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      addToast('Review updated.', 'success')
    }).catch((err: any) => addToast(err.message, 'error'))
    setEditingReview(null)
  }

  const handleComplete = async (id: string) => {
    try {
      await updateDoc(doc(db, 'reviews', id), { status: 'completed' })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      addToast('Review completed.', 'success')
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-6">
      <PageHeader title="Performance Reviews" description="Evaluate and track staff performance." actionLabel="New Review" onAction={() => setShowForm(true)} />

      <div className="grid gap-4 grid-cols-3">
        <StatCard title="Total Reviews" value={String(reviews?.length || 0)} />
        <StatCard title="Avg Rating" value={String(avgRating)} />
        <StatCard title="Completed" value={String((reviews || []).filter(r => r.status === 'completed').length)} variant="success" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Reviews</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : (reviews || []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-1">No reviews yet</p>
              <p className="text-sm">Click "New Review" to create one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reviews || []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.staffName}</TableCell>
                    <TableCell className="text-sm">{r.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{r.rating}</span>
                        <span className="text-xs text-muted-foreground">/5</span>
                        <span className="text-xs text-muted-foreground ml-1">— {RATING_LABELS[r.rating]}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.reviewerName}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'completed' ? 'success' : 'warning'}>{r.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => setMenuOpen(menuOpen === r.id ? null : r.id)}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        {menuOpen === r.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                            <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-md border bg-card shadow-lg">
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" onClick={() => { setEditingReview(r); setMenuOpen(null) }}>
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                              </button>
                              {r.status === 'draft' && (
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" onClick={() => { handleComplete(r.id); setMenuOpen(null) }}>
                                  <CheckCircle className="w-3.5 h-3.5" /> Complete
                                </button>
                              )}
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent" onClick={() => { setDeleteTarget(r); setMenuOpen(null) }}>
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

      <ReviewForm open={showForm} onClose={() => setShowForm(false)} onSubmit={handleAdd} />
      {editingReview && (
        <ReviewForm
          open={!!editingReview}
          onClose={() => setEditingReview(null)}
          onSubmit={handleEdit}
          initial={{
            staffId: editingReview.staffId || '',
            staffName: editingReview.staffName,
            rating: String(editingReview.rating),
            date: editingReview.date,
            strengths: editingReview.strengths,
            improvements: editingReview.improvements,
            goals: editingReview.goals,
          }}
        />
      )}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) { remove(deleteTarget.id); setDeleteTarget(null) } }} title="Delete Review" message={`Delete review for ${deleteTarget?.staffName}?`} confirmLabel="Delete" />
    </div>
  )
}