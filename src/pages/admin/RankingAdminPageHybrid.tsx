import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Trophy,
  Medal,
  AlertTriangle
} from 'lucide-react'
import hybridRankingService from '@/services/hybridRankingService'
import TeamLogo from '@/components/ui/TeamLogo'
import ActionButtonGroup from '@/components/ui/ActionButtonGroup'
import { getTeamPublicUrl } from '@/services/apiService'

const filterSelectClass =
  'h-7 w-full min-w-[5.5rem] rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400'

const RankingAdminPageHybrid: React.FC = () => {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<string>('beach_mixed')
  const [selectedSeason, setSelectedSeason] = useState<string>('current')

  const categories = [
    { value: 'beach_mixed', label: 'Playa Mixto', icon: '🏖️' },
    { value: 'beach_open', label: 'Playa Open', icon: '🏖️' },
    { value: 'beach_women', label: 'Playa Women', icon: '🏖️' },
    { value: 'grass_mixed', label: 'Césped Mixto', icon: '⚽' },
    { value: 'grass_open', label: 'Césped Open', icon: '⚽' },
    { value: 'grass_women', label: 'Césped Women', icon: '⚽' }
  ]

  const seasons = [
    { value: 'current', label: 'Ranking Actual' },
    { value: '2025-26', label: 'Temporada 2025-26' },
    { value: '2024-25', label: 'Temporada 2024-25' },
    { value: '2023-24', label: 'Temporada 2023-24' },
    { value: '2022-23', label: 'Temporada 2022-23' }
  ]

  // Determinar la temporada de referencia
  const referenceSeason = selectedSeason === 'current' ? '2024-25' : selectedSeason

  // Query optimizada usando el sistema híbrido
  const { data: rankingData, isLoading: isLoadingRanking, error, refetch } = useQuery({
    queryKey: ['hybrid-admin-ranking', selectedCategory, referenceSeason],
    queryFn: () => hybridRankingService.getRankingFromSeasonPoints(
      selectedCategory as any,
      referenceSeason
    ),
    staleTime: 2 * 60 * 1000, // 2 minutos
    enabled: !!selectedCategory && !!referenceSeason
  })

  const handleRefresh = () => {
    refetch()
  }

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (position === 3) return <Medal className="w-6 h-6 text-orange-500" />
    return <span className="text-sm font-semibold text-gray-500">#{position}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="page-header-title">Ranking Actual</h1>
        <p className="text-gray-600 mt-1">
          Sistema híbrido optimizado - Datos desde team_season_points
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-6">
        <span className="block text-sm font-medium text-slate-700 mb-2">
          Superficie
        </span>
        <div
          className="flex flex-wrap gap-1.5"
          role="radiogroup"
          aria-label="Superficie"
        >
          {categories.map((category) => {
            const isActive = selectedCategory === category.value
            return (
              <button
                key={category.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setSelectedCategory(category.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span aria-hidden="true">{category.icon}</span>
                {category.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Ranking */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Ranking Actual – {categories.find(c => c.value === selectedCategory)?.label}
            </h2>
            <div className="flex flex-col items-end gap-1">
              <label htmlFor="ranking-season-select" className="sr-only">
                Temporada
              </label>
              <select
                id="ranking-season-select"
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className={`${filterSelectClass} w-auto min-w-[10rem]`}
              >
                {seasons.map(season => (
                  <option key={season.value} value={season.value}>
                    {season.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoadingRanking ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando ranking...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>Error al cargar el ranking</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posición
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Región
                  </th>
                  {selectedSeason === 'current' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        2024-25
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        2023-24
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        2022-23
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        2021-22
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </>
                  )}
                  {selectedSeason !== 'current' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Puntos
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rankingData?.map((team, index) => (
                  <tr key={team.team_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRankIcon(team.ranking_position)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TeamLogo name={team.team_name} logo={team.logo} size="sm" />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {team.team_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {team.ranking_category.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {team.team?.region?.name || 'Sin región'}
                    </td>
                    {selectedSeason === 'current' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {team.season_breakdown?.['2024-25']?.weighted_points?.toFixed(1) || '0.0'}
                          {team.season_breakdown?.['2024-25'] && (
                            <div className="text-xs text-gray-400">
                              (x{team.season_breakdown['2024-25'].coefficient?.toFixed(1)})
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {team.season_breakdown?.['2023-24']?.weighted_points?.toFixed(1) || '0.0'}
                          {team.season_breakdown?.['2023-24'] && (
                            <div className="text-xs text-gray-400">
                              (x{team.season_breakdown['2023-24'].coefficient?.toFixed(1)})
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {team.season_breakdown?.['2022-23']?.weighted_points?.toFixed(1) || '0.0'}
                          {team.season_breakdown?.['2022-23'] && (
                            <div className="text-xs text-gray-400">
                              (x{team.season_breakdown['2022-23'].coefficient?.toFixed(1)})
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {team.season_breakdown?.['2021-22']?.weighted_points?.toFixed(1) || '0.0'}
                          {team.season_breakdown?.['2021-22'] && (
                            <div className="text-xs text-gray-400">
                              (x{team.season_breakdown['2021-22'].coefficient?.toFixed(1)})
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {team.total_points?.toFixed(1) || '0.0'}
                        </td>
                      </>
                    )}
                    {selectedSeason !== 'current' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {team.total_points?.toFixed(1) || '0.0'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex justify-end">
                        <ActionButtonGroup
                          onView={() => navigate(getTeamPublicUrl({ id: team.team_id }))}
                          onEdit={() => navigate(`/admin/teams/${team.team_id}/edit`)}
                          viewTooltip="Ver equipo"
                          editTooltip="Editar equipo"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">ℹ️ Información del sistema híbrido</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Fuente de datos:</strong> team_season_points (cache materializada)</p>
          <p><strong>Actualización:</strong> Automática al cambiar positions</p>
          <p><strong>Rendimiento:</strong> Consultas instantáneas</p>
          <p><strong>Históricos:</strong> Acceso rápido a cualquier temporada</p>
        </div>
      </div>
    </div>
  )
}

export default RankingAdminPageHybrid
