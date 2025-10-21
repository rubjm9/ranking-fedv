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
          syncRankings: { success: false, message: 'Error', categories: [] }
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
      console.log('🔄 Iniciando sincronización rápida...')
      const result = await rankingUpdateService.syncCurrentRankingsOnly()
      
      setLastResult({
        success: result.success,
        message: result.message,
        steps: {
          regenerateSeasons: { success: true, message: 'Omitido', seasons: [] },
          syncRankings: { success: result.success, message: result.message, categories: [] }
        }
      })
    } catch (error: any) {
      console.error('❌ Error en sincronización:', error)
      setLastResult({
        success: false,
        message: `Error: ${error.message}`,
        steps: {
          regenerateSeasons: { success: false, message: 'Error', seasons: [] },
          syncRankings: { success: false, message: 'Error', categories: [] }
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
              <p><strong>Actualización Completa:</strong> Después de agregar datos de torneos de cualquier temporada (ej: datos 2021-22)</p>
              <p><strong>Sincronización Rápida:</strong> Cuando solo necesitas actualizar los rankings actuales desde datos ya procesados</p>
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
              <p className="text-sm text-gray-600">Regenera temporadas + Sincroniza rankings</p>
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
            <p>• Regenera todas las temporadas desde positions</p>
            <p>• Sincroniza current_rankings</p>
            <p>• Proceso completo pero más lento</p>
          </div>
        </div>

        {/* Sincronización rápida */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sincronización Rápida</h3>
              <p className="text-sm text-gray-600">Solo actualiza rankings actuales</p>
            </div>
          </div>
          
          <button
            onClick={handleQuickSync}
            disabled={isQuickSync}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <CheckCircle className={`w-5 h-5 ${isQuickSync ? 'animate-spin' : ''}`} />
            <span>{isQuickSync ? 'Sincronizando...' : 'Sincronización Rápida'}</span>
          </button>

          <div className="mt-4 text-xs text-gray-500">
            <p>• Solo sincroniza current_rankings</p>
            <p>• No regenera temporadas</p>
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
                  lastResult.steps.syncRankings.success 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  <div className="flex items-center">
                    {lastResult.steps.syncRankings.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                    )}
                    <span className="font-medium text-sm">Sincronización de Rankings</span>
                  </div>
                  <p className="text-xs mt-1 text-gray-600">
                    {lastResult.steps.syncRankings.message}
                    {lastResult.steps.syncRankings.categories.length > 0 && (
                      <span className="ml-2">
                        ({lastResult.steps.syncRankings.categories.join(', ')})
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
