import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { dashboardService } from '@/services/dashboardService'
import DashboardStatCards from '@/components/admin/dashboard/DashboardStatCards'
import DashboardQuickActions from '@/components/admin/dashboard/DashboardQuickActions'
import DashboardActivityFeed from '@/components/admin/dashboard/DashboardActivityFeed'
import DashboardSystemPanel from '@/components/admin/dashboard/DashboardSystemPanel'
import DashboardSubseasonWidget from '@/components/admin/dashboard/DashboardSubseasonWidget'

const DashboardPage: React.FC = () => {
  const statsQuery = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => dashboardService.getDashboardStats(),
  })

  const activityQuery = useQuery({
    queryKey: ['admin-dashboard-activity'],
    queryFn: () => dashboardService.getRecentActivity(),
  })

  const actionsQuery = useQuery({
    queryKey: ['admin-dashboard-actions'],
    queryFn: () => dashboardService.getActionableItems(),
  })

  const healthQuery = useQuery({
    queryKey: ['admin-dashboard-health'],
    queryFn: () => dashboardService.getSystemHealth(),
  })

  const subseasonQuery = useQuery({
    queryKey: ['admin-dashboard-subseasons'],
    queryFn: () => dashboardService.getSubseasonStatus(),
  })

  const hasError =
    statsQuery.isError ||
    activityQuery.isError ||
    actionsQuery.isError ||
    healthQuery.isError ||
    subseasonQuery.isError

  const handleRetry = () => {
    statsQuery.refetch()
    activityQuery.refetch()
    actionsQuery.refetch()
    healthQuery.refetch()
    subseasonQuery.refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-600">Bienvenido al panel de administración FEDV</p>
        </div>
      </div>

      {hasError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center justify-between">
          <p className="text-sm text-red-700">
            No se pudieron cargar algunos datos del dashboard. Comprueba la conexión e inténtalo de nuevo.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      )}

      <DashboardStatCards items={statsQuery.data?.items ?? []} isLoading={statsQuery.isLoading} />

      <DashboardSubseasonWidget status={subseasonQuery.data} isLoading={subseasonQuery.isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardQuickActions />
        <DashboardActivityFeed
          items={activityQuery.data ?? []}
          isLoading={activityQuery.isLoading}
        />
      </div>

      <DashboardSystemPanel
        health={healthQuery.data}
        actions={actionsQuery.data ?? []}
        isLoading={healthQuery.isLoading || actionsQuery.isLoading}
      />
    </div>
  )
}

export default DashboardPage
