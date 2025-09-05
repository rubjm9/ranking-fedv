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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Cargando región...</span>
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{region.name}</h1>
              <p className="text-gray-600">Detalles de la región</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/admin/regions/${region.id}/edit`)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors flex items-center"
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Información General</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <p className="text-lg font-medium text-gray-900">{region.name}</p>
              </div>
              
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coeficiente</label>
                <div className="flex items-center">
                  <span className={`text-lg font-bold ${getCoefficientColor(region.coefficient)}`}>
                    {region.coefficient.toFixed(2)}
                  </span>
                  <Calculator className="h-4 w-4 ml-2 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Creación</label>
                <p className="text-sm text-gray-900">
                  {new Date(region.createdAt).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>

            {region.description && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <p className="text-gray-900">{region.description}</p>
              </div>
            )}
          </div>

          {/* Estadísticas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Estadísticas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{region._count?.teams || region.teams?.length || 0}</div>
                <div className="text-sm text-gray-500">Equipos</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{region._count?.tournaments || region.tournaments?.length || 0}</div>
                <div className="text-sm text-gray-500">Torneos</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {region.averagePoints ? region.averagePoints.toFixed(0) : '0'}
                </div>
                <div className="text-sm text-gray-500">Puntos Promedio</div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Acciones Rápidas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/admin/regions/${region.id}/edit`)}
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Región
              </button>
              
              <button
                onClick={() => navigate('/admin/teams', { state: { regionFilter: region.id } })}
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              >
                <Users className="h-4 w-4 mr-2" />
                Ver Equipos
              </button>
              
              <button
                onClick={() => navigate('/admin/tournaments', { state: { regionFilter: region.id } })}
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Ver Torneos
              </button>
            </div>
          </div>

          {/* Información del Sistema */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Sistema</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID:</span>
                <span className="font-medium text-gray-900">{region.id}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Creado:</span>
                <span className="font-medium text-gray-900">
                  {new Date(region.createdAt).toLocaleDateString('es-ES')}
                </span>
              </div>
              
              {region.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Actualizado:</span>
                  <span className="font-medium text-gray-900">
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
  if (coefficient >= 1.5) return 'text-green-600'
  if (coefficient >= 1.0) return 'text-blue-600'
  if (coefficient >= 0.8) return 'text-yellow-600'
  return 'text-red-600'
}

export default RegionDetailAdminPage
