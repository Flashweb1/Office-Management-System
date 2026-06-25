import { useState, useRef, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useCollection } from '@/hooks/useFirestore'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: notifications } = useCollection<any>('notifications', {
    whereFilters: user ? [['userId', '==', user.id], ['read', '==', false]] : undefined,
    orderByFilter: ['createdAt', 'desc'],
    limitCount: 10,
  })

  const unread = notifications?.length || 0

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleMarkRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true })
    } catch {}
  }

  const navAndClose = (path?: string) => {
    setOpen(false)
    if (path) navigate(path)
  }

  return (
    <div ref={ref} className="relative">
      <button className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => setOpen(!open)}>
        <Bell size={18} />
        {unread > 0 && (
          <span className={cn(
            'absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center',
          )}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-md border bg-card shadow-lg">
          <div className="p-3 border-b">
            <p className="text-sm font-semibold">Notifications</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {(!notifications || notifications.length === 0) ? (
              <p className="text-sm text-muted-foreground p-4 text-center">No new notifications.</p>
            ) : (
              notifications.map((n: any) => (
                <button
                  key={n.id}
                  className="w-full text-left px-4 py-3 hover:bg-accent border-b last:border-0"
                  onClick={() => { handleMarkRead(n.id); navAndClose(n.link) }}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                </button>
              ))
            )}
          </div>
          <button
            className="w-full p-2 text-center text-xs text-primary hover:bg-accent border-t"
            onClick={() => navAndClose('/notifications')}
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  )
}