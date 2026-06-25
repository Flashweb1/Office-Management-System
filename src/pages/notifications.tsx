import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { useCollection } from '@/hooks/useFirestore'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCheck, Bell, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  danger: XCircle,
}

export function NotificationsPage() {
  const { user } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const { data: notifications } = useCollection<any>('notifications', {
    whereFilters: user ? [['userId', '==', user.id]] : undefined,
    orderByFilter: ['createdAt', 'desc'],
  })

  const handleMarkAllRead = async () => {
    if (!notifications) return
    try {
      const promises = notifications.filter((n: any) => !n.read).map((n: any) =>
        updateDoc(doc(db, 'notifications', n.id), { read: true })
      )
      await Promise.all(promises)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      addToast('All notifications marked as read.', 'success')
    } catch {
      addToast('Failed to mark all as read.', 'error')
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } catch {}
  }

  const unread = (notifications || []).filter((n: any) => !n.read).length

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="w-3.5 h-3.5 mr-1.5" /> Mark All Read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {(!notifications || notifications.length === 0) ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-lg font-medium mb-1">No notifications</p>
              <p className="text-sm">Notifications will appear here as activity happens.</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((n: any) => {
            const Icon = TYPE_ICONS[n.type] || Info
            return (
              <Card key={n.id} className={n.read ? '' : 'border-primary/30 bg-primary/5'}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="p-1.5 rounded-full bg-primary/10 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    {n.createdAt && (
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {new Date(n.createdAt.seconds * 1000).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {!n.read && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)}>
                      <CheckCheck className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}