/**
 * Componente de banner de notificaciones para el panel de administración
 * Muestra notificaciones fijas cuando hay subtemporadas/temporadas por consolidar
 */

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bell, X, CheckCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react'
import subseasonDetectionService, { AdminNotification } from '@/services/subseasonDetectionService'

interface AdminNotificationBannerProps {
  className?: string
}

const AdminNotificationBanner: React.FC<AdminNotificationBannerProps> = ({ className = '' }) => {
  const queryClient = useQueryClient()

  // Obtener notificaciones pendientes
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['admin-notifications-pending'],
    queryFn: () => subseasonDetectionService.getPendingNotifications(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // Refrescar cada 10 minutos
  })

  // Mutación para descartar notificación
  const dismissMutation = useMutation({
    mutationFn: (notificationId: string) => subseasonDetectionService.dismissNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-pending'] })
    }
  })

  // Mutación para marcar como leída
  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => subseasonDetectionService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-pending'] })
    }
  })

  if (isLoading || !notifications || notifications.length === 0) {
    return null
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'subseason_complete':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'season_complete':
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      case 'data_inconsistency':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case 'subseason_complete':
        return 'bg-green-50 border-green-200'
      case 'season_complete':
        return 'bg-blue-50 border-blue-200'
      case 'data_inconsistency':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {notifications.map((notification: AdminNotification) => (
        <div
          key={notification.id}
          className={`${getBgColor(notification.type)} border rounded-lg p-4 shadow-sm`}
        >
          <div className="flex items-start gap-3">
            {/* Icono */}
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900 text-sm">
                  {notification.title}
                </h4>
                {notification.season && (
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                    {notification.season}
                  </span>
                )}
                {notification.subseason && (
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                    Subtemporada {notification.subseason}
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>

              {/* Acciones */}
              <div className="flex items-center gap-3 mt-3">
                {notification.action_url && (
                  <Link
                    to={notification.action_url}
                    onClick={() => markReadMutation.mutate(notification.id)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {notification.action_label || 'Ver más'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                
                <button
                  onClick={() => dismissMutation.mutate(notification.id)}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={dismissMutation.isPending}
                >
                  Descartar
                </button>
              </div>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={() => dismissMutation.mutate(notification.id)}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={dismissMutation.isPending}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Componente compacto para mostrar solo un contador de notificaciones
 */
export const NotificationBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { data: notifications } = useQuery({
    queryKey: ['admin-notifications-pending'],
    queryFn: () => subseasonDetectionService.getPendingNotifications(),
    staleTime: 5 * 60 * 1000,
  })

  const count = notifications?.length || 0

  if (count === 0) return null

  return (
    <div className={`relative inline-flex ${className}`}>
      <Bell className="w-5 h-5 text-gray-600" />
      <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
        {count > 9 ? '9+' : count}
      </span>
    </div>
  )
}

export default AdminNotificationBanner



