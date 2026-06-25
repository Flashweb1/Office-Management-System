import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface DriverFormData {
  name: string
  phone: string
  licenseNo: string
  truckId: string
  status: string
}

interface DriverFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: DriverFormData) => void
  initial?: DriverFormData
}

const defaultData: DriverFormData = {
  name: '',
  phone: '',
  licenseNo: '',
  truckId: '',
  status: 'available',
}

export function DriverForm({ open, onClose, onSubmit, initial }: DriverFormProps) {
  const [data, setData] = useState<DriverFormData>(initial || defaultData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
    setData(defaultData)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={initial ? 'Edit Driver' : 'Add Driver'} description={initial ? 'Update driver details.' : 'Add a new driver.'}>
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Full Name</Label>
              <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} required placeholder="John Driver" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} required placeholder="+1-555-0100" />
            </div>
            <div>
              <Label>License No.</Label>
              <Input value={data.licenseNo} onChange={(e) => setData({ ...data, licenseNo: e.target.value })} placeholder="CDL-12345" />
            </div>
            <div>
              <Label>Truck Plate</Label>
              <Input value={data.truckId} onChange={(e) => setData({ ...data, truckId: e.target.value })} placeholder="TRK-001" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={data.status} onChange={(e) => setData({ ...data, status: e.target.value })} options={[
                { value: 'available', label: 'Available' },
                { value: 'on_trip', label: 'On Trip' },
                { value: 'off_duty', label: 'Off Duty' },
              ]} />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initial ? 'Save Changes' : 'Add Driver'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}