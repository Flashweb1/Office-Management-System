import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  Users,
  Building2,
  Truck,
  ClipboardList,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Role } from '@/types'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  roles: Role[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['CEO', 'OPS_MANAGER', 'FINANCE', 'SALES', 'SUPPORT'] },
  { label: 'Staff', path: '/staff', icon: Users, roles: ['CEO'] },
  { label: 'Customers', path: '/customers', icon: Building2, roles: ['CEO', 'OPS_MANAGER', 'FINANCE', 'SALES', 'SUPPORT'] },
  { label: 'Shipments', path: '/shipments', icon: Truck, roles: ['CEO', 'OPS_MANAGER', 'SALES'] },
  { label: 'Fleet', path: '/fleet', icon: ClipboardList, roles: ['CEO', 'OPS_MANAGER'] },
  { label: 'Invoices', path: '/invoices', icon: FileText, roles: ['CEO', 'FINANCE'] },
  { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['CEO', 'FINANCE'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['CEO', 'OPS_MANAGER', 'FINANCE', 'SALES', 'SUPPORT'] },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuthStore()
  const { logout } = useAuth()
  const userRole = user?.role || 'CEO'

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole))

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-muted">
            <div>
              <h1 className="text-lg font-bold">LogiCommand</h1>
              <p className="text-xs text-sidebar-foreground/60">Logistics ERP</p>
            </div>
            <button onClick={onClose} className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-sidebar-muted">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
