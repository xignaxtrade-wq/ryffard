import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SuperAdminRoute({ children }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando panel maestro...</div>
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />
  }

  if (!profile.is_superadmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
