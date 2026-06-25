import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface InvoiceFormData {
  customerName: string
  amount: string
  dueDate: string
  status: string
  shipmentId: string
}

interface InvoiceFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: InvoiceFormData) => void
  initial?: InvoiceFormData
}

const defaultData: InvoiceFormData = {
  customerName: '',
  amount: '',
  dueDate: '',
  status: 'pending',
  shipmentId: '',
}

export function InvoiceForm({ open, onClose, onSubmit, initial }: InvoiceFormProps) {
  const [data, setData] = useState<InvoiceFormData>(initial || defaultData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
    setData(defaultData)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={initial ? 'Edit Invoice' : 'New Invoice'} description={initial ? 'Update invoice details.' : 'Create an invoice for a customer.'}>
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Customer Name</Label>
              <Input value={data.customerName} onChange={(e) => setData({ ...data, customerName: e.target.value })} required placeholder="ABC Logistics" />
            </div>
            <div>
              <Label>Amount ($)</Label>
              <Input type="number" min="0" step="0.01" value={data.amount} onChange={(e) => setData({ ...data, amount: e.target.value })} required placeholder="3200" />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={data.dueDate} onChange={(e) => setData({ ...data, dueDate: e.target.value })} required />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={data.status} onChange={(e) => setData({ ...data, status: e.target.value })} options={[
                { value: 'pending', label: 'Pending' },
                { value: 'paid', label: 'Paid' },
              ]} />
            </div>
            <div>
              <Label>Shipment ID (optional)</Label>
              <Input value={data.shipmentId} onChange={(e) => setData({ ...data, shipmentId: e.target.value })} placeholder="SHP-1024" />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initial ? 'Save Changes' : 'Create Invoice'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}