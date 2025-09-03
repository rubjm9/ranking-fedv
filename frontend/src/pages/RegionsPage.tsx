import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Users, TrendingUp, Trophy, ChevronRight, BarChart3, Loader2 } from 'lucide-react'
import { regionsService } from '@/services/apiService'

const RegionsPage = () => {
  const [sortBy, setSortBy] = useState<'name' | 'coefficient' | 'teams' | 'points'>('coefficient')

  // Obtener regiones desde la API
  const { data: regionsData, isLoading, error } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsService.getAll()
  })

  const regions = regionsData?.data || []

  // Ordenar regiones
  const sortedRegions = [...regions].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'coefficient':
        return b.coefficient - a.coefficient
      case 'teams':
        return (b.teams?.length || 0) - (a.teams?.length || 0)
      case 'points':
        return 0 // Por ahora no tenemos puntos totales por región
      default:
        return 0
    }
  })

  // Estadísticas globales
  const totalRegions = regions.length
  const totalTeams = regions.reduce((sum, region) => sum + (region.teams?.length || 0), 0)
  const averageCoefficient = regions.length ?
    (regions.reduce((sum, region) => sum + region.coefficient, 0) / regions.length).toFixed(2) : '0.00'

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Regiones</h1>
        <p className="text-xl text-gray-600">
          Explora las regiones participantes en el Ranking FEDV
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Regiones</p>
              <p className="text-2xl font-bold text-gray-900">{totalRegions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Equipos</p>
              <p className="text-2xl font-bold text-gray-900">{totalTeams}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Coef. Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{averageCoefficient}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros de ordenación */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Ordenar por:</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('name')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                sortBy === 'name'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Nombre
            </button>
            <button
              onClick={() => setSortBy('coefficient')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                sortBy === 'coefficient'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Coeficiente
            </button>
            <button
              onClick={() => setSortBy('teams')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                sortBy === 'teams'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Equipos
            </button>
          </div>
        </div>
      </div>

      {/* Lista de regiones */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedRegions.map((region) => (
            <Link
              key={region.id}
              to={`/regions/${region.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-6 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {region.name}
                    </h3>
                    <p className="text-sm text-gray-600">{region.code}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Coeficiente:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {region.coefficient.toFixed(2)}x
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Equipos:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {region.teams?.length || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Torneos:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {region.tournaments?.length || 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default RegionsPage
