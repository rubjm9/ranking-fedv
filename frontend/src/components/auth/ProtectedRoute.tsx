import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  console.log('🛡️ ProtectedRoute - Estado:', { isAuthenticated, isLoading, user: user?.email })

  if (isLoading) {
    console.log('⏳ ProtectedRoute - Cargando...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verificando autenticación..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute - No autenticado, redirigiendo a login')
    // Redirigir al login con la ubicación actual para volver después
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  console.log('✅ ProtectedRoute - Autenticado, mostrando contenido')
  return <>{children}</>
}

export default ProtectedRoute
