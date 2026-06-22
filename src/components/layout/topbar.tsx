import { Bell, Menu, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface TopBarProps {
  onMenuClick: () => void
  unreadAlerts?: number
}

export function TopBar({ onMenuClick, unreadAlerts = 0 }: TopBarProps) {
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
        <button className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent">
          <Bell size={18} />
          {unreadAlerts > 0 && (
            <span className={cn(
              'absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center',
            )}>
              {unreadAlerts}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
