import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CustomerFormData {
  companyName: string
  contactPerson: string
  phone: string
  email: string
  creditLimit: string
  paymentTerms: string
  notes: string
}

interface CustomerFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CustomerFormData) => void
  initial?: CustomerFormData
}

const defaultData: CustomerFormData = {
  companyName: '',
  contactPerson: '',
  phone: '',
  email: '',
  creditLimit: '',
  paymentTerms: 'net30',
  notes: '',
}

export function CustomerForm({ open, onClose, onSubmit, initial }: CustomerFormProps) {
  const [data, setData] = useState<CustomerFormData>(initial || defaultData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
    setData(defaultData)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={initial ? 'Edit Customer' : 'Add Customer'} description="Enter the customer's company and contact details.">
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Company Name</Label>
              <Input value={data.companyName} onChange={(e) => setData({ ...data, companyName: e.target.value })} required placeholder="ABC Logistics" />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input value={data.contactPerson} onChange={(e) => setData({ ...data, contactPerson: e.target.value })} required placeholder="John Smith" />
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
              <Label>Payment Terms</Label>
              <Select value={data.paymentTerms} onChange={(e) => setData({ ...data, paymentTerms: e.target.value })} options={[
                { value: 'net15', label: 'Net 15' },
                { value: 'net30', label: 'Net 30' },
                { value: 'net45', label: 'Net 45' },
                { value: 'net60', label: 'Net 60' },
              ]} />
            </div>
            <div className="sm:col-span-2">
              <Label>Credit Limit ($)</Label>
              <Input type="number" min="0" value={data.creditLimit} onChange={(e) => setData({ ...data, creditLimit: e.target.value })} required placeholder="50000" />
            </div>
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <Textarea value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} placeholder="Optional notes..." />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initial ? 'Save Changes' : 'Add Customer'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
