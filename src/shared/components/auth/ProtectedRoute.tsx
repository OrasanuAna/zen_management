import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { paths } from '@/app/router/paths'
import { useAuth } from '@/app/providers/AuthProvider'
import { Spinner } from '@/shared/components/ui/Spinner'

export function ProtectedRoute() {
  const { firebaseUser, loading, firebaseReady } = useAuth()
  const location = useLocation()

  if (!firebaseReady) {
    return <Navigate to={paths.login} replace state={{ from: location.pathname }} />
  }

  if (loading) {
    return (
      <div className="zs-route-loading">
        <Spinner label="Se încarcă sesiunea…" />
      </div>
    )
  }

  if (!firebaseUser) {
    return <Navigate to={paths.login} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
