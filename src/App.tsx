import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/app-layout'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { AIChatWidget } from '@/components/ai/ai-chat-widget'
import { ToastContainer } from '@/components/ui/toast'
import { LoginPage } from '@/pages/login'
import { DashboardPage } from '@/pages/dashboard'
import { StaffPage } from '@/pages/staff'
import { CustomersPage } from '@/pages/customers'
import { CustomerDetailPage } from '@/pages/customer-detail'
import { ShipmentsPage } from '@/pages/shipments'
import { ShipmentDetailPage } from '@/pages/shipment-detail'
import { FleetPage } from '@/pages/fleet'
import { InvoicesPage } from '@/pages/invoices'
import { ReportsPage } from '@/pages/reports'
import { SettingsPage } from '@/pages/settings'
import { ReceiptPage } from '@/pages/receipt'
import { LandingPage } from '@/pages/landing'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'

const queryClient = new QueryClient()

function AppRoutes() {
  const { isLoading } = useAuth()
  const { user } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/staff"
          element={
            <ProtectedRoute roles={['CEO']}>
              <StaffPage />
            </ProtectedRoute>
          }
        />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/shipments" element={<ShipmentsPage />} />
        <Route path="/shipments/:id" element={<ShipmentDetailPage />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route
        path="/invoices/:id/receipt"
        element={
          <ProtectedRoute>
            <ReceiptPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <AIChatWidget />
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
