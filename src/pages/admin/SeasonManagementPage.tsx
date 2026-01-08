import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Lock, Unlock, TrendingUp, BarChart3, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import seasonPointsService from '../../services/seasonPointsService'
import hybridRankingService from '../../services/hybridRankingService'
import teamSeasonRankingsService from '../../services/teamSeasonRankingsService'
import subseasonDetectionService from '../../services/subseasonDetectionService'
import { verifyAllOptimizations } from '../../utils/verifyOptimizations'

const SeasonManagementPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState('')
  const [seasonStats, setSeasonStats] = useState<any>(null)
  const [verificationResults, setVerificationResults] = useState<any>(null)
  const queryClient = useQueryClient()

  // Obtener estado de la temporada actual
  const { data: seasonStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['season-status', selectedSeason],
    queryFn: () => selectedSeason ? subseasonDetectionService.detectSeasonStatus(selectedSeason) : null,
    enabled: !!selectedSeason
  })

  // Verificar optimizaciones al cargar
  useEffect(() => {
    const runVerification = async () => {
      const results = await verifyAllOptimizations()
      setVerificationResults(results)
    }
    runVerification()
  }, [])

  const handleRegenerateAll = async () => {
    setIsLoading(true)
    try {
      const result = await seasonPointsService.regenerateAllSeasons()
      
      if (result.success) {
        toast.success(result.message)
        console.log('✅ Temporadas regeneradas:', result.seasons)
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerateSeason = async () => {
    if (!selectedSeason) {
      toast.error('Selecciona una temporada')
      return
    }

    setIsLoading(true)
    try {
      const result = await seasonPointsService.calculateAndSaveSeasonPoints(selectedSeason)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseSeason = async () => {
    if (!selectedSeason) {
      toast.error('Selecciona una temporada')
      return
    }

    if (!confirm(`¿Cerrar temporada ${selectedSeason}? Esto la marcará como completa.`)) {
      return
    }

    setIsLoading(true)
    try {
      const result = await seasonPointsService.closeSeason(selectedSeason)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetStats = async () => {
    if (!selectedSeason) {
      toast.error('Selecciona una temporada')
      return
    }

    setIsLoading(true)
    try {
      const stats = await seasonPointsService.getSeasonStats(selectedSeason)
      setSeasonStats(stats)
      toast.success('Estadísticas obtenidas')
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncRankings = async () => {
    if (!confirm('¿Sincronizar todos los rankings con la tabla team_season_points?')) {
      return
    }

    setIsLoading(true)
    try {
      const categories = [
        'beach_mixed',
        'beach_open',
        'beach_women',
        'grass_mixed',
        'grass_open',
        'grass_women'
      ]

      const referenceSeason = selectedSeason || '2024-25'

      for (const category of categories) {
        await hybridRankingService.syncWithCurrentRankings(
          category as any,
          referenceSeason
        )
      }

      toast.success('Todos los rankings sincronizados')
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Consolidar subtemporada - actualiza team_season_rankings con position_change
  const handleConsolidateSubseason = async (subseason: number) => {
    if (!selectedSeason) {
      toast.error('Selecciona una temporada primero')
      return
    }

    if (!confirm(`¿Consolidar subtemporada ${subseason} de ${selectedSeason}? Esto actualizará los rankings históricos y cambios de posición.`)) {
      return
    }

    setIsLoading(true)
    try {
      // 1. Recalcular rankings de la temporada (incluye position_change)
      const result = await teamSeasonRankingsService.calculateSeasonRankings(selectedSeason)
      
      if (result.success) {
        // 2. Marcar la notificación como resuelta
        const notifications = await subseasonDetectionService.getPendingNotifications()
        const relatedNotification = notifications.find(
          n => n.type === 'subseason_complete' && n.season === selectedSeason && n.subseason === subseason
        )
        if (relatedNotification) {
          await subseasonDetectionService.resolveNotification(relatedNotification.id)
        }

        // 3. Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: ['admin-notifications-pending'] })
        queryClient.invalidateQueries({ queryKey: ['season-status'] })
        queryClient.invalidateQueries({ queryKey: ['ranking-optimized'] })

        toast.success(`Subtemporada ${subseason} consolidada: ${result.updated} equipos actualizados`)
        refetchStatus()
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Consolidar temporada completa
  const handleConsolidateSeason = async () => {
    if (!selectedSeason) {
      toast.error('Selecciona una temporada primero')
      return
    }

    if (!confirm(`¿Consolidar temporada ${selectedSeason} completa? Esto recalculará todos los rankings y cambios de posición.`)) {
      return
    }

    setIsLoading(true)
    try {
      // 1. Recalcular rankings de la temporada
      const result = await teamSeasonRankingsService.calculateSeasonRankings(selectedSeason)
      
      if (result.success) {
        // 2. Marcar notificaciones como resueltas
        const notifications = await subseasonDetectionService.getPendingNotifications()
        for (const n of notifications) {
          if (n.season === selectedSeason) {
            await subseasonDetectionService.resolveNotification(n.id)
          }
        }

        // 3. Invalidar queries
        queryClient.invalidateQueries({ queryKey: ['admin-notifications-pending'] })
        queryClient.invalidateQueries({ queryKey: ['season-status'] })
        queryClient.invalidateQueries({ queryKey: ['ranking-optimized'] })
        queryClient.invalidateQueries({ queryKey: ['most-recent-seasons-all'] })

        toast.success(`Temporada ${selectedSeason} consolidada: ${result.updated} equipos actualizados`)
        refetchStatus()
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Recalcular todas las temporadas históricas
  const handleRecalculateAllRankings = async () => {
    if (!confirm('¿Recalcular rankings históricos de TODAS las temporadas? Esto puede tardar varios minutos.')) {
      return
    }

    setIsLoading(true)
    try {
      const result = await teamSeasonRankingsService.recalculateAllSeasons()
      
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['ranking-optimized'] })
        queryClient.invalidateQueries({ queryKey: ['season-status'] })
        toast.success(`${result.totalUpdated} registros actualizados en rankings históricos`)
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de temporadas</h1>
          <p className="text-gray-600 mt-1">
            Sistema híbrido: cache materializada de temporadas
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/ranking-update"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualizar Rankings</span>
          </Link>
        </div>
      </div>

      {/* Información del sistema */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Sobre el sistema híbrido</h2>
        <p className="text-sm text-blue-800">
          El sistema utiliza una tabla <code className="bg-blue-100 px-1 rounded">team_season_points</code> que 
          almacena puntos por equipo y temporada. Esto permite:
        </p>
        <ul className="text-sm text-blue-800 mt-2 ml-4 list-disc space-y-1">
          <li>Consultas instantáneas de rankings históricos</li>
          <li>Gráficas de evolución temporal</li>
          <li>Comparativas entre temporadas</li>
          <li>Regeneración desde datos brutos cuando sea necesario</li>
        </ul>
      </div>

      {/* Regenerar todas las temporadas */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Regenerar todas las temporadas</h2>
        <p className="text-sm text-gray-600 mb-4">
          Recalcula todos los puntos de todas las temporadas desde los datos brutos (tabla positions).
          Útil cuando cambias fórmulas de cálculo o necesitas reconstruir completamente la cache.
        </p>
        <button
          onClick={handleRegenerateAll}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Regenerar todas las temporadas</span>
        </button>
      </div>

      {/* Acciones por temporada */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones por temporada</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar temporada
          </label>
          <input
            type="text"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            placeholder="Ej: 2024-25"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Formato: YYYY-YY (ejemplo: 2024-25)</p>
        </div>

        {/* Estado de la temporada */}
        {seasonStatus && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="font-medium text-gray-900 mb-3">Estado de {selectedSeason}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(subseason => {
                const categories = subseason === 1 ? ['beach_mixed'] 
                  : subseason === 2 ? ['beach_open', 'beach_women']
                  : subseason === 3 ? ['grass_mixed']
                  : ['grass_open', 'grass_women']
                
                const hasData = categories.some(cat => 
                  seasonStatus.categories[cat]?.hasData
                )

                return (
                  <div 
                    key={subseason}
                    className={`p-3 rounded-lg border ${hasData ? 'bg-green-50 border-green-200' : 'bg-gray-100 border-gray-200'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {hasData ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="font-medium text-sm">Sub {subseason}</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {categories.map(c => c.replace('_', ' ')).join(', ')}
                    </p>
                    {hasData && (
                      <button
                        onClick={() => handleConsolidateSubseason(subseason)}
                        disabled={isLoading}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Consolidar
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            
            {seasonStatus.isComplete && (
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={handleConsolidateSeason}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition w-full"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Consolidar temporada completa</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleRegenerateSeason}
            disabled={isLoading || !selectedSeason}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Regenerar puntos</span>
          </button>

          <button
            onClick={handleCloseSeason}
            disabled={isLoading || !selectedSeason}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Lock className="w-4 h-4" />
            <span>Cerrar temporada</span>
          </button>

          <button
            onClick={handleGetStats}
            disabled={isLoading || !selectedSeason}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Estadísticas</span>
          </button>
        </div>
      </div>

      {/* Estadísticas de temporada */}
      {seasonStats && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Estadísticas de {selectedSeason}
          </h2>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <strong>Total de equipos:</strong> {seasonStats.total_teams}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(seasonStats.categories || {}).map(category => (
              <div key={category} className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  {category.replace('_', ' ')}
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Equipos:</strong> {seasonStats.categories[category].teams}</p>
                  <p><strong>Total puntos:</strong> {seasonStats.categories[category].total_points.toFixed(1)}</p>
                  <p><strong>Promedio:</strong> {seasonStats.categories[category].avg_points.toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rankings históricos */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rankings históricos (team_season_rankings)</h2>
        <p className="text-sm text-gray-600 mb-4">
          La tabla <code className="bg-gray-100 px-1 rounded">team_season_rankings</code> almacena rankings pre-calculados 
          con cambios de posición incluidos. Esto optimiza las consultas de la web pública.
        </p>
        <button
          onClick={handleRecalculateAllRankings}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Recalcular todos los rankings históricos</span>
        </button>
      </div>

      {/* Verificación de optimizaciones */}
      {verificationResults && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Verificación de optimizaciones</h2>
          
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border ${verificationResults.positionChange.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {verificationResults.positionChange.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <h3 className="font-medium">Columnas position_change</h3>
              </div>
              <p className="text-sm text-gray-700">{verificationResults.positionChange.message}</p>
              {verificationResults.positionChange.details && (
                <div className="mt-2 text-xs text-gray-600">
                  <p>Registros con datos: {verificationResults.positionChange.details.recordsWithData} / {verificationResults.positionChange.details.totalRecords}</p>
                </div>
              )}
            </div>

            <div className={`p-4 rounded-lg border ${verificationResults.adminNotifications.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {verificationResults.adminNotifications.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <h3 className="font-medium">Tabla admin_notifications</h3>
              </div>
              <p className="text-sm text-gray-700">{verificationResults.adminNotifications.message}</p>
            </div>

            <div className={`p-4 rounded-lg border ${verificationResults.historicalRankings.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {verificationResults.historicalRankings.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <h3 className="font-medium">Rankings históricos</h3>
              </div>
              <p className="text-sm text-gray-700">{verificationResults.historicalRankings.message}</p>
              {verificationResults.historicalRankings.details && (
                <div className="mt-2 text-xs text-gray-600">
                  <p>Temporadas: {verificationResults.historicalRankings.details.seasons?.join(', ') || 'N/A'}</p>
                </div>
              )}
            </div>

            {verificationResults.allSuccess && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  ✅ Todas las optimizaciones están funcionando correctamente
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ayuda */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">💡 Cuándo usar cada acción</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Regenerar puntos:</strong> Si corriges resultados de una temporada específica</p>
          <p><strong>Consolidar subtemporada:</strong> Cuando termina una subtemporada (ej: después del CE1 de playa mixto)</p>
          <p><strong>Cerrar temporada:</strong> Cuando termina oficialmente (todos los CEs completados)</p>
          <p><strong>Recalcular rankings históricos:</strong> Actualiza cambios de posición y rankings pre-calculados</p>
        </div>
      </div>
    </div>
  )
}

export default SeasonManagementPage

