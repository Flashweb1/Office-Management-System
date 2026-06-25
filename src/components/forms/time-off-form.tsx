import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface TimeOffFormData {
  staffId: string
  staffName: string
  type: string
  startDate: string
  endDate: string
  reason: string
}

interface TimeOffFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: TimeOffFormData) => void
}

const defaultData: TimeOffFormData = {
  staffId: '',
  staffName: '',
  type: 'vacation',
  startDate: '',
  endDate: '',
  reason: '',
}

export function TimeOffForm({ open, onClose, onSubmit }: TimeOffFormProps) {
  const [data, setData] = useState<TimeOffFormData>(defaultData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
    setData(defaultData)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Request Time Off" description="Submit a time-off request.">
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Staff Name</Label>
              <Input value={data.staffName} onChange={(e) => setData({ ...data, staffName: e.target.value })} required placeholder="John Doe" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={data.type} onChange={(e) => setData({ ...data, type: e.target.value })} options={[
                { value: 'vacation', label: 'Vacation' },
                { value: 'sick', label: 'Sick Leave' },
                { value: 'personal', label: 'Personal' },
              ]} />
            </div>
            <div></div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={data.startDate} onChange={(e) => setData({ ...data, startDate: e.target.value })} required />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={data.endDate} onChange={(e) => setData({ ...data, endDate: e.target.value })} required />
            </div>
            <div className="sm:col-span-2">
              <Label>Reason</Label>
              <Input value={data.reason} onChange={(e) => setData({ ...data, reason: e.target.value })} placeholder="Optional reason" />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Submit Request</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}