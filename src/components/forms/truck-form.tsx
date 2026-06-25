import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface TruckFormData {
  plateNumber: string
  model: string
  maintenanceDate: string
  fuelEfficiency: string
  status: string
}

interface TruckFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: TruckFormData) => void
  initial?: TruckFormData
}

const defaultData: TruckFormData = {
  plateNumber: '',
  model: '',
  maintenanceDate: '',
  fuelEfficiency: '',
  status: 'active',
}

export function TruckForm({ open, onClose, onSubmit, initial }: TruckFormProps) {
  const [data, setData] = useState<TruckFormData>(initial || defaultData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
    setData(defaultData)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={initial ? 'Edit Truck' : 'Add Truck'} description={initial ? 'Update truck details.' : 'Add a new truck to the fleet.'}>
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Plate Number</Label>
              <Input value={data.plateNumber} onChange={(e) => setData({ ...data, plateNumber: e.target.value })} required placeholder="ABC-1234" />
            </div>
            <div>
              <Label>Model</Label>
              <Input value={data.model} onChange={(e) => setData({ ...data, model: e.target.value })} placeholder="Freightliner Cascadia" />
            </div>
            <div>
              <Label>Last Maintenance</Label>
              <Input type="date" value={data.maintenanceDate} onChange={(e) => setData({ ...data, maintenanceDate: e.target.value })} />
            </div>
            <div>
              <Label>Fuel Efficiency (mpg)</Label>
              <Input type="number" min="0" step="0.1" value={data.fuelEfficiency} onChange={(e) => setData({ ...data, fuelEfficiency: e.target.value })} placeholder="6.5" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={data.status} onChange={(e) => setData({ ...data, status: e.target.value })} options={[
                { value: 'active', label: 'Active' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'inactive', label: 'Inactive' },
              ]} />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initial ? 'Save Changes' : 'Add Truck'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}