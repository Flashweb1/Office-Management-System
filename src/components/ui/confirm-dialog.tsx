import { Dialog, DialogContent, DialogFooter } from './dialog'
import { Button } from './button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'default'
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <DialogContent>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${variant === 'danger' ? 'bg-destructive/10' : 'bg-primary/10'}`}>
            <AlertTriangle className={`w-5 h-5 ${variant === 'danger' ? 'text-destructive' : 'text-primary'}`} />
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          variant={variant === 'danger' ? 'destructive' : 'default'}
          onClick={() => { onConfirm(); onClose() }}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
