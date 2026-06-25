import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface ExpenseFormData {
  description: string
  category: string
  amount: string
  date: string
  shipmentId: string
}

interface ExpenseFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ExpenseFormData) => void
  initial?: ExpenseFormData
}

const defaultData: ExpenseFormData = {
  description: '',
  category: 'fuel',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  shipmentId: '',
}

const CATEGORIES = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'admin', label: 'Admin' },
  { value: 'tolls', label: 'Tolls' },
  { value: 'driver_pay', label: 'Driver Pay' },
  { value: 'other', label: 'Other' },
]

export function ExpenseForm({ open, onClose, onSubmit, initial }: ExpenseFormProps) {
  const [data, setData] = useState<ExpenseFormData>(initial || defaultData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
    setData(defaultData)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={initial ? 'Edit Expense' : 'Add Expense'} description={initial ? 'Update expense details.' : 'Record a new expense.'}>
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Input value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} required placeholder="Fuel stop #42" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={data.category} onChange={(e) => setData({ ...data, category: e.target.value })} options={CATEGORIES} />
            </div>
            <div>
              <Label>Amount ($)</Label>
              <Input type="number" min="0" step="0.01" value={data.amount} onChange={(e) => setData({ ...data, amount: e.target.value })} required placeholder="150.00" />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={data.date} onChange={(e) => setData({ ...data, date: e.target.value })} required />
            </div>
            <div>
              <Label>Shipment ID (optional)</Label>
              <Input value={data.shipmentId} onChange={(e) => setData({ ...data, shipmentId: e.target.value })} placeholder="SHP-1024" />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initial ? 'Save Changes' : 'Add Expense'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}