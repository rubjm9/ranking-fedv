import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  Edit, 
  Calculator, 
  Users, 
  Trophy,
  BarChart3
} from 'lucide-react'
import toast from 'react-hot-toast'
import { regionsService, Region } from '@/services/apiService'
import DetailHeaderSkeleton from '@/components/ui/DetailHeaderSkeleton'
import StatsGridSkeleton from '@/components/ui/StatsGridSkeleton'
import TableSkeleton from '@/components/ui/TableSkeleton'

const RegionDetailAdminPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: regionData, isLoading, error } = useQuery({
    queryKey: ['region', id],
    queryFn: () => regionsService.getById(id!),
    enabled: !!id
  })

  const region = regionData?.data

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <DetailHeaderSkeleton variant="default" />
        <StatsGridSkeleton count={3} />
        <TableSkeleton rows={6} columns={4} showLeadingAvatar />
      </div>
    )
  }

  if (error || !region) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error al cargar la región</div>
          <button 
            onClick={() => navigate('/admin/regions')} 
            className="btn-primary"
          >
            Volver a Regiones
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin/regions')}
              className="mr-4 p-2 text-content-subtle hover:text-content-muted hover:bg-surface-muted rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="page-header-title">{region.name}</h1>
              <p className="text-content-muted">Detalles de la región</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/admin/regions/${region.id}/edit`)}
            className="btn-primary flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar Región
          </button>
        </div>
      </div>

      {/* Información Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Información Básica */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
            <h2 className="text-lg font-medium text-content mb-4">Información General</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="block text-sm font-medium text-content-muted mb-2">Nombre</span>
                <p className="text-lg font-medium text-content">{region.name}</p>
              </div>
              
              
              <div>
                <span className="block text-sm font-medium text-content-muted mb-2">Coeficiente</span>
                <div className="flex items-center">
                  <span className={`text-lg font-bold ${getCoefficientColor(region.coefficient)}`}>
                    {region.coefficient.toFixed(2)}
                  </span>
                  <Calculator className="h-4 w-4 ml-2 text-content-subtle" />
                </div>
              </div>
              
              <div>
                <span className="block text-sm font-medium text-content-muted mb-2">Fecha de Creación</span>
                <p className="text-sm text-content">
                  {new Date(region.createdAt).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>

            {region.description && (
              <div className="mt-6">
                <span className="block text-sm font-medium text-content-muted mb-2">Descripción</span>
                <p className="text-content">{region.description}</p>
              </div>
            )}
          </div>

          {/* Estadísticas */}
          <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
            <h2 className="text-lg font-medium text-content mb-4">Estadísticas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-950/50 rounded-lg mx-auto mb-3">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div className="page-header-title">{region._count?.teams || region.teams?.length || 0}</div>
                <div className="text-sm text-content-subtle">Equipos</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-950/50 rounded-lg mx-auto mb-3">
                  <Trophy className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <div className="page-header-title">{region._count?.tournaments || region.tournaments?.length || 0}</div>
                <div className="text-sm text-content-subtle">Campeonatos</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-950/50 rounded-lg mx-auto mb-3">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="page-header-title">
                  {region.averagePoints ? region.averagePoints.toFixed(0) : '0'}
                </div>
                <div className="text-sm text-content-subtle">Puntos Promedio</div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Acciones Rápidas */}
          <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
            <h3 className="text-lg font-medium text-content mb-4">Acciones Rápidas</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/admin/regions/${region.id}/edit`)}
                className="btn-primary w-full flex items-center justify-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Región
              </button>
              
              <button
                onClick={() => navigate('/admin/teams', { state: { regionFilter: region.id } })}
                className="btn-outline w-full flex items-center justify-center"
              >
                <Users className="h-4 w-4 mr-2" />
                Ver Equipos
              </button>
              
              <button
                onClick={() => navigate('/admin/tournaments', { state: { regionFilter: region.id } })}
                className="btn-outline w-full flex items-center justify-center"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Ver campeonatos
              </button>
            </div>
          </div>

          {/* Información del Sistema */}
          <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
            <h3 className="text-lg font-medium text-content mb-4">Información del Sistema</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-content-subtle">ID:</span>
                <span className="font-medium text-content">{region.id}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-content-subtle">Creado:</span>
                <span className="font-medium text-content">
                  {new Date(region.createdAt).toLocaleDateString('es-ES')}
                </span>
              </div>
              
              {region.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-content-subtle">Actualizado:</span>
                  <span className="font-medium text-content">
                    {new Date(region.updatedAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const getCoefficientColor = (coefficient: number) => {
  if (coefficient >= 1.5) return 'text-green-600 dark:text-green-300'
  if (coefficient >= 1.0) return 'text-blue-600 dark:text-blue-300'
  if (coefficient >= 0.8) return 'text-yellow-600 dark:text-yellow-300'
  return 'text-red-600 dark:text-red-300'
}

export default RegionDetailAdminPage
