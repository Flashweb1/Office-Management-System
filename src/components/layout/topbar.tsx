import { Menu, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { NotificationBell } from '@/components/notifications/notification-bell'

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b bg-background px-4 lg:px-6 h-16">
      <button onClick={onMenuClick} className="lg:hidden text-muted-foreground hover:text-foreground">
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search shipments, customers..." className="pl-9 h-9" />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <NotificationBell />
      </div>
    </header>
  )
}