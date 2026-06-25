import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, addDoc, doc as fbDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useDocument } from '@/hooks/useFirestore'
import { useFirestoreMutation } from '@/hooks/useFirestoreMutation'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Trash2, Paperclip } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Shipment } from '@/types'

export function ShipmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDelete, setShowDelete] = useState(false)

  const { data: s, isLoading } = useDocument<Shipment>('shipments', id)
  const { remove } = useFirestoreMutation<Shipment>('shipments', {
    onSuccess: () => navigate('/shipments'),
  })

  const { data: files, refetch: refetchFiles } = useQuery<UploadedFile[]>({
    queryKey: ['shipment-files', id],
    queryFn: async () => {
      if (!id) return []
      const q = query(collection(db, 'shipments', id, 'files'))
      const snap = await getDocs(q)
      return snap.docs.map((d) => d.data() as UploadedFile)
    },
    enabled: !!id,
  })

  const handleUpload = async (file: UploadedFile) => {
    await addDoc(collection(db, 'shipments', id!, 'files'), file)
    refetchFiles()
  }

  const handleRemoveFile = async (file: UploadedFile) => {
    const q = query(collection(db, 'shipments', id!, 'files'), where('path', '==', file.path))
    const snap = await getDocs(q)
    for (const snapDoc of snap.docs) {
      await deleteDoc(fbDoc(db, 'shipments', id!, 'files', snapDoc.id))
    }
    refetchFiles()
  }

  if (isLoading) {
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

  if (!s) {
    return <div className="text-center py-12 text-muted-foreground">Shipment not found.</div>
  }

  const profit = (s.revenue || 0) - (s.cost || 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/shipments')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{s.id}</h1>
              <Badge variant={s.status === 'delivered' ? 'success' : s.status === 'delayed' ? 'danger' : 'warning'}>
                {s.status?.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-muted-foreground">{s.lane}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Customer" value={s.customerName || 'N/A'} />
        <StatCard title="Lane" value={s.lane || 'N/A'} />
        <StatCard title="Pickup" value={s.pickupDate || 'N/A'} />
        <StatCard title="Delivery" value={s.deliveryDate || 'N/A'} />
      </div>

      <div className="grid gap-4 grid-cols-4">
        <StatCard title="Revenue" value={formatCurrency(s.revenue || 0)} variant="success" />
        <StatCard title="Cost" value={formatCurrency(s.cost || 0)} variant="warning" />
        <StatCard title="Gross Profit" value={formatCurrency(profit)} variant={profit >= 0 ? 'success' : 'danger'} />
        <StatCard title="Margin" value={s.revenue ? `${((profit / s.revenue) * 100).toFixed(1)}%` : '0%'} variant={profit >= 0 ? 'success' : 'danger'} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            path={`shipments/${id}`}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            onUpload={handleUpload}
            onRemove={handleRemoveFile}
            existingFiles={files || []}
          />
        </CardContent>
      </Card>

      {s.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{s.notes}</p></CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => remove(s.id)}
        title="Delete Shipment"
        message={`Are you sure you want to delete ${s.id}? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}