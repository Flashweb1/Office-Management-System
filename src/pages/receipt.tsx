import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useDocument } from '@/hooks/useFirestore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Printer } from 'lucide-react'

export function ReceiptPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: inv } = useDocument<any>('invoices', id)

  const handlePrint = () => window.print()

  if (!inv) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Receipt not found.</p>
        <Button variant="link" onClick={() => navigate('/invoices')}>Back to Invoices</Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="flex items-center justify-between mb-6 no-print">
        <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Print
        </Button>
      </div>

      <div className="border rounded-lg bg-card p-8 shadow-sm receipt">
        <div className="text-center mb-6 pb-6 border-b">
          <h1 className="text-2xl font-bold">LogiCommand</h1>
          <p className="text-sm text-muted-foreground">Logistics Enterprise Management</p>
          <p className="text-xs text-muted-foreground mt-1">123 Logistics Ave, New York, NY 10001</p>
        </div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Receipt</p>
            <h2 className="text-lg font-semibold">{inv.id}</h2>
            <p className="text-sm text-muted-foreground">{inv.paidDate ? formatDate(inv.paidDate) : formatDate(inv.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Status</p>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-success/10 text-success">
              Paid
            </span>
          </div>
        </div>

        <div className="mb-6 pb-6 border-b">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Customer</p>
          <p className="font-medium">{inv.customerName}</p>
        </div>

        <div className="mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground uppercase text-xs">Description</th>
                <th className="text-right py-2 font-medium text-muted-foreground uppercase text-xs">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3">
                  <p className="font-medium">Invoice {inv.id}</p>
                  {inv.shipmentId && (
                    <p className="text-xs text-muted-foreground">Shipment: {inv.shipmentId}</p>
                  )}
                </td>
                <td className="text-right py-3 font-medium">{formatCurrency(inv.amount || 0)}</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-sm"></td>
                <td className="text-right py-3">
                  <div className="border-t pt-2">
                    <span className="text-lg font-bold">{formatCurrency(inv.amount || 0)}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {inv.paymentRef && (
          <div className="text-xs text-muted-foreground">
            <p>Payment Reference: {inv.paymentRef}</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t text-center text-xs text-muted-foreground">
          <p>Thank you for your business!</p>
          <p className="mt-1">LogiCommand Logistics — office-management-system-f345e</p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .receipt { border: none !important; box-shadow: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  )
}
