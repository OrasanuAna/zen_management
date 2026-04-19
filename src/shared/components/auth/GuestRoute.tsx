import { Navigate, Outlet } from 'react-router-dom'
import { paths } from '@/app/router/paths'
import { useAuth } from '@/app/providers/AuthProvider'
import { Spinner } from '@/shared/components/ui/Spinner'

export function GuestRoute() {
  const { firebaseUser, loading, firebaseReady } = useAuth()

  if (!firebaseReady) {
    return <Outlet />
  }

  if (loading) {
    return (
      <div className="zs-route-loading">
        <Spinner label="Se încarcă…" />
      </div>
    )
  }

  if (firebaseUser) {
    return <Navigate to={paths.dashboard} replace />
  }

  return <Outlet />
}
