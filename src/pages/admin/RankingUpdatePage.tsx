import React, { useState } from 'react'
import { RefreshCw, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import rankingUpdateService, { UpdateResult } from '@/services/rankingUpdateService'

const RankingUpdatePage: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastResult, setLastResult] = useState<UpdateResult | null>(null)
  const [isQuickSync, setIsQuickSync] = useState(false)

  const handleCompleteUpdate = async () => {
    setIsUpdating(true)
    setLastResult(null)
    
    try {
      console.log('🚀 Iniciando actualización completa...')
      const result = await rankingUpdateService.updateCompleteRankingSystem()
      setLastResult(result)
      
      if (result.success) {
        console.log('✅ Actualización completa exitosa')
      } else {
        console.warn('⚠️ Actualización parcial:', result.message)
      }
    } catch (error: any) {
      console.error('❌ Error en actualización:', error)
      setLastResult({
        success: false,
        message: `Error crítico: ${error.message}`,
        steps: {
          regenerateSeasons: { success: false, message: 'Error', seasons: [] },
          rebuildRankings: { success: false, message: 'Error', totalUpdated: 0 }
        }
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleQuickSync = async () => {
    setIsQuickSync(true)
    setLastResult(null)

    try {
      console.log('🏆 Reconstruyendo rankings...')
      const result = await rankingUpdateService.syncCurrentRankingsOnly()

      setLastResult({
        success: result.success,
        message: result.message,
        steps: {
          regenerateSeasons: { success: true, message: 'Omitido', seasons: [] },
          rebuildRankings: { success: result.success, message: result.message, totalUpdated: 0 }
        }
      })
    } catch (error: any) {
      console.error('❌ Error en reconstrucción:', error)
      setLastResult({
        success: false,
        message: `Error: ${error.message}`,
        steps: {
          regenerateSeasons: { success: false, message: 'Error', seasons: [] },
          rebuildRankings: { success: false, message: 'Error', totalUpdated: 0 }
        }
      })
    } finally {
      setIsQuickSync(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Actualización de Rankings</h1>
        <p className="text-lg text-gray-600">
          Centraliza todas las operaciones de actualización del sistema de rankings
        </p>
      </div>

      {/* Información importante */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-start">
          <Info className="w-6 h-6 text-blue-500 mr-3 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">¿Cuándo usar cada opción?</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Actualización Completa:</strong> Después de agregar o corregir datos de torneos. Recalcula puntos, regenera temporadas y reconstruye los rankings públicos (team_season_rankings)</p>
              <p><strong>Reconstruir Rankings:</strong> Cuando los puntos por temporada ya están bien y solo hay que recalcular el orden de los rankings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botones principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Actualización completa */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <RefreshCw className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Actualización Completa</h3>
              <p className="text-sm text-gray-600">Recalcula puntos + regenera temporadas + reconstruye rankings</p>
            </div>
          </div>
          
          <button
            onClick={handleCompleteUpdate}
            disabled={isUpdating}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <RefreshCw className={`w-5 h-5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Actualizando...' : 'Actualización Completa'}</span>
          </button>

          <div className="mt-4 text-xs text-gray-500">
            <p>• Recalcula puntos de posiciones con la curva vigente</p>
            <p>• Regenera todas las temporadas (team_season_points)</p>
            <p>• Reconstruye los rankings públicos (team_season_rankings)</p>
          </div>
        </div>

        {/* Reconstruir rankings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Reconstruir Rankings</h3>
              <p className="text-sm text-gray-600">Recalcula el orden desde los puntos ya guardados</p>
            </div>
          </div>

          <button
            onClick={handleQuickSync}
            disabled={isQuickSync}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <CheckCircle className={`w-5 h-5 ${isQuickSync ? 'animate-spin' : ''}`} />
            <span>{isQuickSync ? 'Reconstruyendo...' : 'Reconstruir Rankings'}</span>
          </button>

          <div className="mt-4 text-xs text-gray-500">
            <p>• Reconstruye team_season_rankings</p>
            <p>• No recalcula puntos ni regenera temporadas</p>
            <p>• Proceso rápido</p>
          </div>
        </div>
      </div>

      {/* Resultado */}
      {lastResult && (
        <div className={`rounded-lg p-6 border ${
          lastResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start">
            {lastResult.success ? (
              <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-1" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3 mt-1" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold mb-2 ${
                lastResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {lastResult.success ? '✅ Operación Exitosa' : '❌ Error en Operación'}
              </h3>
              
              <p className={`text-sm mb-4 ${
                lastResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {lastResult.message}
              </p>

              {/* Detalles de pasos */}
              <div className="space-y-3">
                <div className={`p-3 rounded ${
                  lastResult.steps.regenerateSeasons.success 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  <div className="flex items-center">
                    {lastResult.steps.regenerateSeasons.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                    )}
                    <span className="font-medium text-sm">Regeneración de Temporadas</span>
                  </div>
                  <p className="text-xs mt-1 text-gray-600">
                    {lastResult.steps.regenerateSeasons.message}
                    {lastResult.steps.regenerateSeasons.seasons.length > 0 && (
                      <span className="ml-2">
                        ({lastResult.steps.regenerateSeasons.seasons.join(', ')})
                      </span>
                    )}
                  </p>
                </div>

                <div className={`p-3 rounded ${
                  lastResult.steps.rebuildRankings.success
                    ? 'bg-green-100'
                    : 'bg-red-100'
                }`}>
                  <div className="flex items-center">
                    {lastResult.steps.rebuildRankings.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                    )}
                    <span className="font-medium text-sm">Reconstrucción de Rankings</span>
                  </div>
                  <p className="text-xs mt-1 text-gray-600">
                    {lastResult.steps.rebuildRankings.message}
                    {lastResult.steps.rebuildRankings.totalUpdated > 0 && (
                      <span className="ml-2">
                        ({lastResult.steps.rebuildRankings.totalUpdated} registros)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RankingUpdatePage
