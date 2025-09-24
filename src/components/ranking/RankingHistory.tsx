import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import rankingService, { RankingHistoryEntry } from '@/services/rankingService'
import TeamLogo from '@/components/ui/TeamLogo'

interface RankingHistoryProps {
  category?: string
  teamId?: string
  limit?: number
}

const RankingHistory: React.FC<RankingHistoryProps> = ({ 
  category = 'beach_mixed', 
  teamId, 
  limit = 20 
}) => {
  const [selectedCategory, setSelectedCategory] = useState(category)

  const { data: historyData, isLoading, error, refetch } = useQuery({
    queryKey: ['ranking-history', selectedCategory, teamId, limit],
    queryFn: () => rankingService.getRankingHistory(selectedCategory, teamId, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const categories = [
    { value: 'beach_mixed', label: 'Playa Mixto', icon: '🏖️' },
    { value: 'beach_open', label: 'Playa Open', icon: '🏖️' },
    { value: 'beach_women', label: 'Playa Women', icon: '🏖️' },
    { value: 'grass_mixed', label: 'Césped Mixto', icon: '⚽' },
    { value: 'grass_open', label: 'Césped Open', icon: '⚽' },
    { value: 'grass_women', label: 'Césped Women', icon: '⚽' }
  ]

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 bg-green-50'
    if (change < 0) return 'text-red-600 bg-red-50'
    return 'text-gray-600 bg-gray-50'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center text-red-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Error al cargar el historial de ranking</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <History className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Historial de Cambios
            </h3>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <Filter className="h-4 w-4 text-gray-400" />
          <label className="text-sm font-medium text-gray-700">Categoría:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando historial...</span>
          </div>
        ) : historyData && historyData.length > 0 ? (
          <div className="space-y-4">
            {historyData.map((entry: RankingHistoryEntry, index: number) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {/* Logo del equipo */}
                  <div className="flex-shrink-0">
                    <TeamLogo
                      name={entry.team_name}
                      size="sm"
                    />
                  </div>

                  {/* Información del equipo */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {entry.team_name}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(entry.calculated_at)}</span>
                      <span>•</span>
                      <span>Temporada {entry.season}</span>
                    </div>
                  </div>
                </div>

                {/* Posición y cambios */}
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      Posición #{entry.position}
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.total_points.toFixed(1)} pts
                    </div>
                  </div>

                  {/* Indicador de cambio */}
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getChangeColor(entry.change_from_previous)}`}>
                    {getChangeIcon(entry.change_from_previous)}
                    <span>
                      {entry.change_from_previous > 0 ? '+' : ''}{entry.change_from_previous}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay historial disponible
            </h3>
            <p className="text-gray-500">
              No se encontraron cambios recientes en el ranking para esta categoría.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RankingHistory
