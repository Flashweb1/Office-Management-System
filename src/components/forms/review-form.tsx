import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface ReviewFormData {
  staffId: string
  staffName: string
  rating: string
  date: string
  strengths: string
  improvements: string
  goals: string
}

interface ReviewFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ReviewFormData) => void
  initial?: ReviewFormData
}

const defaultData: ReviewFormData = {
  staffId: '',
  staffName: '',
  rating: '3',
  date: new Date().toISOString().split('T')[0],
  strengths: '',
  improvements: '',
  goals: '',
}

export function ReviewForm({ open, onClose, onSubmit, initial }: ReviewFormProps) {
  const [data, setData] = useState<ReviewFormData>(initial || defaultData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
    setData(defaultData)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={initial ? 'Edit Review' : 'New Review'} description="Evaluate staff performance.">
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Staff Name</Label>
              <Input value={data.staffName} onChange={(e) => setData({ ...data, staffName: e.target.value })} required placeholder="John Doe" />
            </div>
            <div>
              <Label>Rating</Label>
              <Select value={data.rating} onChange={(e) => setData({ ...data, rating: e.target.value })} options={[
                { value: '1', label: '1 - Poor' },
                { value: '2', label: '2 - Below Average' },
                { value: '3', label: '3 - Meets Expectations' },
                { value: '4', label: '4 - Exceeds Expectations' },
                { value: '5', label: '5 - Outstanding' },
              ]} />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={data.date} onChange={(e) => setData({ ...data, date: e.target.value })} required />
            </div>
            <div className="sm:col-span-2">
              <Label>Strengths</Label>
              <Input value={data.strengths} onChange={(e) => setData({ ...data, strengths: e.target.value })} placeholder="Key strengths..." />
            </div>
            <div className="sm:col-span-2">
              <Label>Areas for Improvement</Label>
              <Input value={data.improvements} onChange={(e) => setData({ ...data, improvements: e.target.value })} placeholder="Growth areas..." />
            </div>
            <div className="sm:col-span-2">
              <Label>Goals</Label>
              <Input value={data.goals} onChange={(e) => setData({ ...data, goals: e.target.value })} placeholder="Next period goals..." />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initial ? 'Save Changes' : 'Create Review'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}