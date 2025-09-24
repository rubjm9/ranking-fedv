import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { 
  TrendingUp, 
  BarChart3, 
  Filter,
  RefreshCw,
  AlertCircle,
  Users
} from 'lucide-react'
import rankingService, { RankingEvolution as RankingEvolutionData } from '@/services/rankingService'

interface RankingEvolutionProps {
  teamId?: string
  category?: string
  showPosition?: boolean
  showPoints?: boolean
}

const RankingEvolution: React.FC<RankingEvolutionProps> = ({ 
  teamId,
  category = 'beach_mixed',
  showPosition = true,
  showPoints = true
}) => {
  const [selectedCategory, setSelectedCategory] = useState(category)
  const [chartType, setChartType] = useState<'position' | 'points'>('position')

  const { data: evolutionData, isLoading, error, refetch } = useQuery<RankingEvolutionData>({
    queryKey: ['ranking-evolution', teamId, selectedCategory],
    queryFn: () => rankingService.getTeamEvolution(teamId || '', selectedCategory),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const categories = [
    { value: 'beach_mixed', label: 'Playa Mixto', icon: '🏖️' },
    { value: 'beach_open', label: 'Playa Open', icon: '🏖️' },
    { value: 'beach_women', label: 'Playa Women', icon: '🏖️' },
    { value: 'grass_mixed', label: 'Césped Mixto', icon: '⚽' },
    { value: 'grass_open', label: 'Césped Open', icon: '⚽' },
    { value: 'grass_women', label: 'Césped Women', icon: '⚽' }
  ]

  // Preparar datos para el gráfico
  const chartData = evolutionData?.data?.map((entry, index) => ({
    season: entry.season,
    position: entry.position,
    points: entry.points,
    change: entry.change,
    // Para el gráfico de posición, invertir los valores (posición 1 = mejor)
    positionInverted: evolutionData.data.length - entry.position + 1
  })) || []

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Temporada: ${label}`}</p>
          <p className="text-sm text-gray-600">
            Posición: #{data.position}
          </p>
          <p className="text-sm text-gray-600">
            Puntos: {data.points.toFixed(1)}
          </p>
          {data.change !== 0 && (
            <p className={`text-sm ${data.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Cambio: {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center text-red-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Error al cargar la evolución del ranking</span>
        </div>
      </div>
    )
  }

  if (!teamId) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selecciona un equipo
          </h3>
          <p className="text-gray-500">
            Selecciona un equipo para ver su evolución en el ranking.
          </p>
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
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Evolución de {evolutionData?.team_name || 'Equipo'}
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

      {/* Controles */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
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

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Mostrar:</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setChartType('position')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  chartType === 'position'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Posición
              </button>
              <button
                onClick={() => setChartType('points')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  chartType === 'points'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Puntos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando evolución...</span>
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="season" 
                  stroke="#666"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                  domain={chartType === 'position' ? ['dataMax + 1', 'dataMin - 1'] : ['dataMin - 10', 'dataMax + 10']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {chartType === 'position' ? (
                  <Line
                    type="monotone"
                    dataKey="positionInverted"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                    name="Posición (invertida)"
                  />
                ) : (
                  <Line
                    type="monotone"
                    dataKey="points"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                    name="Puntos"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay datos de evolución
            </h3>
            <p className="text-gray-500">
              Este equipo no tiene suficientes datos históricos para mostrar la evolución.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RankingEvolution
