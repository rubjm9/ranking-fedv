import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, 
  MapPin, 
  Calculator, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  BarChart3,
  TrendingUp,
  Search,
  Filter,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { regionsService, Region } from '@/services/apiService'

const RegionsAdminPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [isRecalculating, setIsRecalculating] = useState(false)

  // Obtener regiones desde la API
  const { data: regionsData, isLoading, error } = useQuery({
    queryKey: ['regions', searchTerm],
    queryFn: () => regionsService.getAll({
      search: searchTerm || undefined
    })
  })

  // Mutación para eliminar región
  const deleteRegionMutation = useMutation({
    mutationFn: (id: string) => regionsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] })
      toast.success('Región eliminada exitosamente')
      setShowDeleteModal(false)
      setSelectedRegion(null)
    },
    onError: (error: any) => {
      console.error('Error al eliminar región:', error)
      
      // Manejar diferentes tipos de errores
      if (error.response?.status === 409) {
        toast.error('No se puede eliminar la región porque tiene equipos o torneos asociados. Primero elimina o reasigna los equipos y torneos.')
      } else if (error.response?.status === 404) {
        toast.error('La región no fue encontrada')
      } else if (error.response?.status === 401) {
        toast.error('No tienes permisos para eliminar regiones')
      } else {
        toast.error(error.response?.data?.error || error.response?.data?.message || 'Error al eliminar la región')
      }
    }
  })

  // Mutación para recalcular coeficientes
  const recalculateMutation = useMutation({
    mutationFn: () => regionsService.recalculateCoefficients(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] })
      toast.success('Coeficientes recalculados exitosamente')
      setIsRecalculating(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al recalcular coeficientes')
      setIsRecalculating(false)
    }
  })

  const regions = regionsData?.data || []

  const handleDelete = (region: Region) => {
    setSelectedRegion(region)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (selectedRegion) {
      deleteRegionMutation.mutate(selectedRegion.id)
    }
  }

  const handleRecalculateCoefficients = () => {
    setIsRecalculating(true)
    recalculateMutation.mutate()
  }

  const filteredRegions = regions.filter(region => {
    const matchesSearch = region.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error al cargar las regiones</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regiones</h1>
          <p className="text-gray-600">Gestiona las regiones del ranking FEDV</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRecalculateCoefficients}
            disabled={isRecalculating}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isRecalculating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            Recalcular Coeficientes
          </button>
          <button
            onClick={() => navigate('/admin/regions/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Región
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar regiones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Región
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coeficiente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número de Equipos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRegions.map((region) => (
                <tr key={region.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{region.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">{region.coefficient.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-medium">{region._count?.teams || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/regions/${region.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/regions/${region.id}/edit`)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(region)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && selectedRegion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmar eliminación
            </h3>
            
            {/* Información de datos asociados */}
            {(selectedRegion._count?.teams > 0 || selectedRegion._count?.tournaments > 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Datos asociados encontrados
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc list-inside space-y-1">
                        {selectedRegion._count?.teams > 0 && (
                          <li>{selectedRegion._count.teams} equipo(s) asociado(s)</li>
                        )}
                        {selectedRegion._count?.tournaments > 0 && (
                          <li>{selectedRegion._count.tournaments} torneo(s) asociado(s)</li>
                        )}
                      </ul>
                    </div>
                    <div className="mt-2 text-sm text-yellow-700">
                      <strong>Nota:</strong> No se puede eliminar una región que tiene equipos o torneos asociados.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar la región "{selectedRegion.name}"? 
              {selectedRegion._count?.teams > 0 || selectedRegion._count?.tournaments > 0 ? (
                <span className="text-red-600 font-medium"> Esta acción no se puede realizar mientras tenga datos asociados.</span>
              ) : (
                <span> Esta acción no se puede deshacer.</span>
              )}
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteRegionMutation.isPending || (selectedRegion._count?.teams > 0 || selectedRegion._count?.tournaments > 0)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteRegionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegionsAdminPage
