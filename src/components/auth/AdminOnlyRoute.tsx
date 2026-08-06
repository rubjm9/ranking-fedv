import React, { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/SimpleAuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface AdminOnlyRouteProps {
  children: React.ReactNode
}

const AdminOnlyRoute: React.FC<AdminOnlyRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth()
  const deniedToastShown = useRef(false)
  const isDenied = !isLoading && (!isAuthenticated || !isAdmin)

  useEffect(() => {
    if (isDenied && !deniedToastShown.current) {
      deniedToastShown.current = true
      toast.error('Solo los administradores pueden acceder a esta sección')
    }
  }, [isDenied])

  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verificando permisos..." />
      </div>
    )
  }

  if (isDenied) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <>{children}</>
}

export default AdminOnlyRoute
