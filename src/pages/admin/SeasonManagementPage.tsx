import React, { useState } from 'react'
import { RefreshCw, Lock, Unlock, TrendingUp, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import seasonPointsService from '../../services/seasonPointsService'
import hybridRankingService from '../../services/hybridRankingService'

const SeasonManagementPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState('')
  const [seasonStats, setSeasonStats] = useState<any>(null)

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

      const referenceSeason = '2024-25' // TODO: Obtener dinámicamente

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

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de temporadas</h1>
        <p className="text-gray-600 mt-1">
          Sistema híbrido: cache materializada de temporadas
        </p>
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

      {/* Acciones globales */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones globales</h2>
        
        <div className="space-y-4">
          <button
            onClick={handleRegenerateAll}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Regenerando...' : 'Regenerar todas las temporadas'}</span>
          </button>

          <button
            onClick={handleSyncRankings}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <TrendingUp className="w-5 h-5" />
            <span>Sincronizar rankings actuales</span>
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Regenerar:</strong> Recalcula todas las temporadas desde positions (datos brutos)</p>
          <p><strong>Sincronizar:</strong> Actualiza current_rankings desde team_season_points</p>
        </div>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleRegenerateSeason}
            disabled={isLoading || !selectedSeason}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Regenerar</span>
          </button>

          <button
            onClick={handleCloseSeason}
            disabled={isLoading || !selectedSeason}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Lock className="w-4 h-4" />
            <span>Cerrar</span>
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

      {/* Ayuda */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">💡 Cuándo usar cada acción</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Regenerar todas:</strong> Al inicio, o si cambias fórmulas de cálculo</p>
          <p><strong>Regenerar temporada:</strong> Si corriges resultados de una temporada específica</p>
          <p><strong>Cerrar temporada:</strong> Cuando termina oficialmente (todos los CEs completados)</p>
          <p><strong>Sincronizar rankings:</strong> Para actualizar la vista pública desde la cache</p>
        </div>
      </div>
    </div>
  )
}

export default SeasonManagementPage

