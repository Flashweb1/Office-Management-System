import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface StaffFormData {
  name: string
  email: string
  phone: string
  position: string
  department: string
  salary: string
  hireDate: string
}

interface StaffFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: StaffFormData) => void
  initial?: StaffFormData
}

const defaultData: StaffFormData = {
  name: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  salary: '',
  hireDate: '',
}

export function StaffForm({ open, onClose, onSubmit, initial }: StaffFormProps) {
  const [data, setData] = useState<StaffFormData>(initial || defaultData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
    setData(defaultData)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={initial ? 'Edit Staff' : 'Add Staff'} description="Add a new team member.">
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Full Name</Label>
              <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} required placeholder="John Doe" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} required placeholder="john@company.com" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} required placeholder="+1-555-0000" />
            </div>
            <div>
              <Label>Position</Label>
              <Input value={data.position} onChange={(e) => setData({ ...data, position: e.target.value })} required placeholder="Driver" />
            </div>
            <div>
              <Label>Department</Label>
              <Select value={data.department} onChange={(e) => setData({ ...data, department: e.target.value })} options={[
                { value: 'Operations', label: 'Operations' },
                { value: 'Finance', label: 'Finance' },
                { value: 'Sales', label: 'Sales' },
                { value: 'Support', label: 'Support' },
                { value: 'Fleet', label: 'Fleet' },
                { value: 'Admin', label: 'Admin' },
              ]} />
            </div>
            <div>
              <Label>Salary ($/year)</Label>
              <Input type="number" min="0" value={data.salary} onChange={(e) => setData({ ...data, salary: e.target.value })} required placeholder="55000" />
            </div>
            <div>
              <Label>Hire Date</Label>
              <Input type="date" value={data.hireDate} onChange={(e) => setData({ ...data, hireDate: e.target.value })} required />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initial ? 'Save Changes' : 'Add Staff'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
