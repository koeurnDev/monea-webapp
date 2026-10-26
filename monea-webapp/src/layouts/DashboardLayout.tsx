import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ToastProvider } from '@/components/ui/Toast'
import { NotificationProvider } from '@/components/providers/NotificationProvider'
import { DashboardShell } from '@/app/dashboard/_components/DashboardShell'
import LoadingScreen from '@/components/ui/LoadingScreen'

/**
 * Protected Dashboard layout — redirects to /sign-in if unauthenticated.
 * Replaces src/app/dashboard/layout.tsx (server-side auth → client-side auth).
 */
export default function DashboardLayout() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <LoadingScreen />
  if (!user) return <Navigate to="/sign-in" replace state={{ from: location }} />

  const isStaff = user?.type === 'staff' || user?.role === 'STAFF';
  const isAdmin = user?.type === 'admin' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'PLATFORM_OWNER';

  return (
    <ToastProvider>
      <NotificationProvider weddingId={user?.weddingId || ""}>
        <DashboardShell isStaff={isStaff} isAdmin={isAdmin}>
          <Outlet />
        </DashboardShell>
      </NotificationProvider>
    </ToastProvider>
  )
}
