import React, { useState } from 'react'
import migrateToNewRankingSystem from '@/scripts/migrateToNewRankingSystem'
import { calculateAllSubseasonGlobalRankings } from '@/scripts/calculateSubseasonGlobalRankings'
import toast from 'react-hot-toast'
import { Loader2, Play, CheckCircle2, XCircle, AlertTriangle, Database, BarChart } from 'lucide-react'

interface MigrationResult {
  totalSeasons: number
  successfulSeasons: number
  failedSeasons: string[]
  totalTeamsUpdated: number
  startTime: string
  endTime: string
  duration: string
}

const MigrateRankingsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<MigrationResult | null>(null)

  const handleMigrate = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      console.log('🚀 Iniciando migración al nuevo sistema de rankings...')
      const migrationResult = await migrateToNewRankingSystem()
      
      setResult(migrationResult)
      
      if (migrationResult.successfulSeasons === migrationResult.totalSeasons) {
        toast.success('¡Migración completada exitosamente!')
      } else {
        toast.warning(`Migración completada con ${migrationResult.failedSeasons.length} errores`)
      }
    } catch (error: any) {
      console.error('Error al ejecutar la migración:', error)
      toast.error('Error al ejecutar la migración')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCalculateSubseasonRankings = async () => {
    setIsCalculating(true)
    
    try {
      console.log('🚀 Calculando rankings globales de subtemporadas...')
      await calculateAllSubseasonGlobalRankings()
      toast.success('¡Rankings de subtemporadas calculados exitosamente!')
    } catch (error: any) {
      console.error('Error al calcular rankings de subtemporadas:', error)
      toast.error('Error al calcular rankings de subtemporadas')
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-white mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-white">Migrar al Nuevo Sistema de Rankings</h1>
              <p className="text-blue-100 text-sm mt-1">
                Migra datos históricos a team_season_rankings
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información previa */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-900">Importante: Lee antes de ejecutar</h3>
                <div className="mt-2 text-sm text-yellow-800 space-y-2">
                  <p><strong>Este proceso:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Calculará rankings para todas las temporadas en team_season_points</li>
                    <li>Creará registros en la tabla team_season_rankings</li>
                    <li>Aplicará coeficientes de antigüedad (1.0, 0.8, 0.5, 0.2)</li>
                    <li>Puede tardar varios minutos según la cantidad de datos</li>
                  </ul>
                  <p className="mt-3"><strong>Prerrequisitos:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>La migración 007 debe estar ejecutada en Supabase</li>
                    <li>La tabla team_season_rankings debe existir</li>
                    <li>team_season_points debe tener datos históricos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Descripción del proceso */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">1️⃣ Ejecutar Migración</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Análisis:</strong> Detecta todas las temporadas disponibles en team_season_points</p>
                <p><strong>Cálculo:</strong> Para cada temporada y modalidad:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Obtiene puntos base de 4 temporadas (actual + 3 anteriores)</li>
                  <li>Aplica coeficientes de antigüedad (1.0, 0.8, 0.5, 0.2)</li>
                  <li>Calcula ranking por modalidad individual</li>
                  <li>Guarda en team_season_rankings</li>
                </ul>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">2️⃣ Calcular Rankings Subtemporadas</h3>
              <div className="text-sm text-purple-800 space-y-2">
                <p><strong>Proceso:</strong> Para cada temporada, calcula 4 actualizaciones anuales:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Después de jugarse playa mixto</li>
                  <li>Después de jugarse playa open/women</li>
                  <li>Después de jugarse césped mixto</li>
                  <li>Al final de la temporada</li>
                </ul>
                <p className="mt-2"><strong>Resultado:</strong> Gráficas con 4 líneas mostrando evolución</p>
              </div>
            </div>
          </div>

          {/* Botones de ejecución */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handleMigrate}
              disabled={isLoading || isCalculating}
              className={`inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                isLoading || isCalculating
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Migrando datos...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Ejecutar Migración
                </>
              )}
            </button>
            
            <button
              onClick={handleCalculateSubseasonRankings}
              disabled={isLoading || isCalculating}
              className={`inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                isLoading || isCalculating
                  ? 'bg-purple-400 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
              }`}
            >
              {isCalculating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Calculando rankings...
                </>
              ) : (
                <>
                  <BarChart className="mr-2 h-5 w-5" />
                  Calcular Rankings Subtemporadas
                </>
              )}
            </button>
          </div>

          {/* Resultado de la migración */}
          {result && (
            <div className={`mt-6 rounded-lg border ${
              result.successfulSeasons === result.totalSeasons 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  {result.successfulSeasons === result.totalSeasons ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 mr-2" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-yellow-600 mr-2" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">
                    Reporte de Migración
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Total temporadas</div>
                    <div className="text-2xl font-bold text-gray-900">{result.totalSeasons}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Exitosas</div>
                    <div className="text-2xl font-bold text-green-600">{result.successfulSeasons}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Fallidas</div>
                    <div className="text-2xl font-bold text-red-600">{result.failedSeasons.length}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Equipos actualizados</div>
                    <div className="text-2xl font-bold text-blue-600">{result.totalTeamsUpdated}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Inicio:</span>
                    <span className="ml-2 font-medium">{new Date(result.startTime).toLocaleString('es-ES')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fin:</span>
                    <span className="ml-2 font-medium">{new Date(result.endTime).toLocaleString('es-ES')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duración:</span>
                    <span className="ml-2 font-medium">{result.duration}</span>
                  </div>
                </div>

                {result.failedSeasons.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-red-900 mb-2">Temporadas fallidas:</h4>
                    <ul className="text-sm text-red-800 space-y-1">
                      {result.failedSeasons.map((season, index) => (
                        <li key={index} className="flex items-start">
                          <XCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{season}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.successfulSeasons === result.totalSeasons && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-green-900 mb-2">¡Migración completada exitosamente!</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <p><strong>Próximos pasos:</strong></p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Valida que los rankings se muestran correctamente en la web</li>
                        <li>Compara algunos rankings con los actuales</li>
                        <li>Después de validar, ejecuta las migraciones 008, 009 y 010 en Supabase</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Notas adicionales:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Los datos en current_rankings NO se modificarán</li>
              <li>• Puedes ejecutar esta migración múltiples veces sin problemas</li>
              <li>• Los registros existentes en team_season_rankings se sobrescribirán</li>
              <li>• Revisa la consola del navegador para ver logs detallados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MigrateRankingsPage

