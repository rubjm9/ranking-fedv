import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verificando autenticación..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirigir al login con la ubicación actual para volver después
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
