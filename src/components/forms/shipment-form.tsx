import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ShipmentFormData {
  customerName: string
  lane: string
  pickupDate: string
  deliveryDate: string
  revenue: string
  cost: string
  status: string
  notes: string
}

interface ShipmentFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ShipmentFormData) => void
  initial?: ShipmentFormData
}

const defaultData: ShipmentFormData = {
  customerName: '',
  lane: '',
  pickupDate: '',
  deliveryDate: '',
  revenue: '',
  cost: '',
  status: 'pending',
  notes: '',
}

export function ShipmentForm({ open, onClose, onSubmit, initial }: ShipmentFormProps) {
  const [data, setData] = useState<ShipmentFormData>(initial || defaultData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
    setData(defaultData)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={initial ? 'Edit Shipment' : 'New Shipment'} description="Enter shipment details and financials.">
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Customer Name</Label>
              <Input value={data.customerName} onChange={(e) => setData({ ...data, customerName: e.target.value })} required placeholder="ABC Logistics" />
            </div>
            <div className="sm:col-span-2">
              <Label>Lane / Route</Label>
              <Input value={data.lane} onChange={(e) => setData({ ...data, lane: e.target.value })} required placeholder="NYC → CHI" />
            </div>
            <div>
              <Label>Pickup Date</Label>
              <Input type="date" value={data.pickupDate} onChange={(e) => setData({ ...data, pickupDate: e.target.value })} required />
            </div>
            <div>
              <Label>Delivery Date</Label>
              <Input type="date" value={data.deliveryDate} onChange={(e) => setData({ ...data, deliveryDate: e.target.value })} required />
            </div>
            <div>
              <Label>Revenue ($)</Label>
              <Input type="number" min="0" step="0.01" value={data.revenue} onChange={(e) => setData({ ...data, revenue: e.target.value })} required placeholder="3200" />
            </div>
            <div>
              <Label>Cost ($)</Label>
              <Input type="number" min="0" step="0.01" value={data.cost} onChange={(e) => setData({ ...data, cost: e.target.value })} required placeholder="2600" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={data.status} onChange={(e) => setData({ ...data, status: e.target.value })} options={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_transit', label: 'In Transit' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'delayed', label: 'Delayed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]} />
            </div>
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <Textarea value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} placeholder="Optional notes..." />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initial ? 'Save Changes' : 'Create Shipment'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
