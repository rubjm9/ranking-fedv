import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts'
import { 
  BarChart3, 
  Filter,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import rankingService from '@/services/rankingService'

interface SeasonComparisonProps {
  category?: string
  seasons?: string[]
}

const SeasonComparison: React.FC<SeasonComparisonProps> = ({ 
  category = 'beach_mixed',
  seasons = ['2025-26', '2024-25', '2023-24', '2022-23']
}) => {
  const [selectedCategory, setSelectedCategory] = useState(category)
  const [selectedSeasons, setSelectedSeasons] = useState(seasons.slice(0, 2)) // Mostrar solo 2 temporadas por defecto

  const { data: comparisonData, isLoading, error, refetch } = useQuery({
    queryKey: ['season-comparison', selectedCategory, selectedSeasons],
    queryFn: () => rankingService.getSeasonComparison(selectedCategory),
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
  const prepareChartData = () => {
    if (!comparisonData) return []

    // Obtener equipos que aparecen en ambas temporadas seleccionadas
    const teams = new Set<string>()
    selectedSeasons.forEach(season => {
      if (comparisonData[season]) {
        Object.keys(comparisonData[season]).forEach(teamId => {
          teams.add(teamId)
        })
      }
    })

    // Crear datos para el gráfico
    const chartData = Array.from(teams).map(teamId => {
      const teamData: any = { teamId }
      
      selectedSeasons.forEach(season => {
        if (comparisonData[season] && comparisonData[season][teamId]) {
          const team = comparisonData[season][teamId]
          teamData[`${season}_points`] = team.points
          teamData[`${season}_position`] = team.position
          if (!teamData.teamName) {
            teamData.teamName = team.team_name
          }
        } else {
          teamData[`${season}_points`] = 0
          teamData[`${season}_position`] = 0
        }
      })

      return teamData
    }).filter(team => team.teamName) // Solo equipos con nombre

    // Ordenar por puntos de la primera temporada
    return chartData.sort((a, b) => {
      const firstSeason = selectedSeasons[0]
      return (b[`${firstSeason}_points`] || 0) - (a[`${firstSeason}_points`] || 0)
    }).slice(0, 10) // Top 10 equipos
  }

  const chartData = prepareChartData()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.teamName}</p>
          {selectedSeasons.map(season => (
            <p key={season} className="text-sm text-gray-600">
              {season}: {data[`${season}_points`]?.toFixed(1) || 0} pts (#{data[`${season}_position`] || 'N/A'})
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const getChangeIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getChangeColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600 bg-green-50'
    if (current < previous) return 'text-red-600 bg-red-50'
    return 'text-gray-600 bg-gray-50'
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center text-red-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Error al cargar la comparación de temporadas</span>
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
              Comparación entre Temporadas
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
            <label className="text-sm font-medium text-gray-700">Temporadas:</label>
            <div className="flex space-x-2">
              {seasons.map(season => (
                <button
                  key={season}
                  onClick={() => {
                    if (selectedSeasons.includes(season)) {
                      setSelectedSeasons(selectedSeasons.filter(s => s !== season))
                    } else if (selectedSeasons.length < 3) {
                      setSelectedSeasons([...selectedSeasons, season])
                    }
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    selectedSeasons.includes(season)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {season}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando comparación...</span>
          </div>
        ) : chartData.length > 0 ? (
          <div className="space-y-6">
            {/* Gráfico de barras */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="teamName" 
                    stroke="#666"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#666"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {selectedSeasons.map((season, index) => (
                    <Bar
                      key={season}
                      dataKey={`${season}_points`}
                      name={season}
                      fill={index === 0 ? '#3b82f6' : '#10b981'}
                      radius={[2, 2, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tabla de comparación */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipo
                    </th>
                    {selectedSeasons.map(season => (
                      <th key={season} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {season}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cambio
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chartData.map((team, index) => {
                    const currentSeason = selectedSeasons[0]
                    const previousSeason = selectedSeasons[1]
                    const currentPoints = team[`${currentSeason}_points`] || 0
                    const previousPoints = team[`${previousSeason}_points`] || 0
                    const change = currentPoints - previousPoints

                    return (
                      <tr key={team.teamId} className={index < 3 ? 'bg-yellow-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {team.teamName}
                        </td>
                        {selectedSeasons.map(season => (
                          <td key={season} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                            {team[`${season}_points`]?.toFixed(1) || '0.0'}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className={`flex items-center justify-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getChangeColor(currentPoints, previousPoints)}`}>
                            {getChangeIcon(currentPoints, previousPoints)}
                            <span>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay datos de comparación
            </h3>
            <p className="text-gray-500">
              No se encontraron datos suficientes para comparar las temporadas seleccionadas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SeasonComparison
