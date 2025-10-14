import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  BarChart3,
  Users,
  Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/services/supabaseService'
import seasonPointsService from '@/services/seasonPointsService'
import hybridRankingService from '@/services/hybridRankingService'

const DatabaseDiagnosticPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)

  // Query para verificar si la tabla team_season_points existe y tiene datos
  const { data: tableInfo, isLoading: isLoadingTable, refetch: refetchTable } = useQuery({
    queryKey: ['table-diagnostic'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured')
      
      try {
        // Verificar si la tabla existe y contar registros
        const { data: countData, error: countError } = await supabase
          .from('team_season_points')
          .select('*', { count: 'exact', head: true })

        if (countError) {
          return {
            exists: false,
            error: countError.message,
            count: 0
          }
        }

        // Si existe, obtener algunos registros de muestra
        const { data: sampleData, error: sampleError } = await supabase
          .from('team_season_points')
          .select('*')
          .limit(5)

        return {
          exists: true,
          count: countData || 0,
          sample: sampleData || [],
          sampleError: sampleError?.message
        }
      } catch (error: any) {
        return {
          exists: false,
          error: error.message,
          count: 0
        }
      }
    }
  })

  // Query para verificar datos en positions
  const { data: positionsInfo, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['positions-diagnostic'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured')
      
      const { data, error } = await supabase
        .from('positions')
        .select('id, points, teamId, tournamentId, tournaments:tournamentId(year, surface, modality)')
        .limit(10)

      if (error) throw error
      return data || []
    }
  })

  // Query para verificar torneos disponibles
  const { data: tournamentsInfo, isLoading: isLoadingTournaments } = useQuery({
    queryKey: ['tournaments-diagnostic'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured')
      
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, year, surface, modality')
        .not('year', 'is', null)
        .order('year', { ascending: false })

      if (error) throw error
      return data || []
    }
  })

  // Query para verificar la estructura de la tabla teams
  const { data: teamsInfo, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teams-diagnostic'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured')
      
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .limit(5)

      if (error) throw error
      return data || []
    }
  })

  // Query para verificar datos en current_rankings
  const { data: rankingsInfo, isLoading: isLoadingRankings } = useQuery({
    queryKey: ['rankings-diagnostic'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured')
      
      const { data, error } = await supabase
        .from('current_rankings')
        .select('*')
        .limit(5)

      if (error) throw error
      return data || []
    }
  })

  const handleRegenerateData = async () => {
    setIsLoading(true)
    try {
      console.log('🔄 Iniciando regeneración de datos...')
      const result = await seasonPointsService.regenerateAllSeasons()
      console.log('📊 Resultado de regeneración:', result)
      
      if (result.success) {
        toast.success(`${result.message}. Temporadas: ${result.seasons.join(', ')}`)
        // Esperar un poco antes de refrescar para que se complete la transacción
        setTimeout(() => {
          refetchTable()
        }, 1000)
      } else {
        toast.error(`Error: ${result.message}`)
        console.error('❌ Error en regeneración:', result.message)
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
      console.error('❌ Error capturado:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncRankings = async () => {
    setIsLoading(true)
    try {
      const result = await hybridRankingService.syncWithCurrentRankings('beach_mixed', '2024-25')
      if (result.success) {
        toast.success('Rankings sincronizados exitosamente')
        refetchTable()
      } else {
        toast.error(`Error: ${result.error}`)
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Diagnóstico de Base de Datos</h1>
        <p className="text-gray-600 mt-1">
          Verifica el estado de las tablas del sistema híbrido
        </p>
      </div>

      {/* Estado de la tabla team_season_points */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Tabla team_season_points
        </h2>
        
        {isLoadingTable ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-gray-500">Verificando tabla...</span>
          </div>
        ) : tableInfo?.exists ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${
              tableInfo.count > 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center">
                {tableInfo.count > 0 ? (
                  <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
                )}
                <div>
                  <h3 className={`font-semibold ${
                    tableInfo.count > 0 ? 'text-green-900' : 'text-yellow-900'
                  }`}>
                    {tableInfo.count > 0 ? '✅ Tabla existe y tiene datos' : '⚠️ Tabla existe pero está vacía'}
                  </h3>
                  <p className={`text-sm ${
                    tableInfo.count > 0 ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {tableInfo.count > 0 
                      ? `${tableInfo.count} registros encontrados en team_season_points`
                      : 'La tabla team_season_points existe pero no tiene datos. Necesitas regenerar los datos.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {tableInfo.count > 0 && tableInfo.sample && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Muestra de datos:</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(tableInfo.sample, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <div>
                <h3 className="font-semibold text-red-900">❌ Tabla no existe o hay error</h3>
                <p className="text-sm text-red-800">
                  Error: {tableInfo?.error || 'No se pudo acceder a la tabla'}
                </p>
                <p className="text-sm text-red-800 mt-1">
                  Necesitas ejecutar la migración SQL primero.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estado de la tabla positions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Tabla positions (fuente de datos)
        </h2>
        
        {isLoadingPositions ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-gray-500">Verificando positions...</span>
          </div>
        ) : positionsInfo && positionsInfo.length > 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
              <div>
                <h3 className="font-semibold text-green-900">✅ Datos de positions disponibles</h3>
                <p className="text-sm text-green-800">
                  {positionsInfo.length} registros de muestra encontrados
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Muestra de positions:</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {JSON.stringify(positionsInfo.slice(0, 3), null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <div>
                <h3 className="font-semibold text-red-900">❌ No hay datos en positions</h3>
                <p className="text-sm text-red-800">
                  No se encontraron registros en la tabla positions
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estado de torneos */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Torneos disponibles
        </h2>
        
        {isLoadingTournaments ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-gray-500">Verificando torneos...</span>
          </div>
        ) : tournamentsInfo && tournamentsInfo.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <div>
                  <h3 className="font-semibold text-green-900">✅ Torneos encontrados</h3>
                  <p className="text-sm text-green-800">
                    {tournamentsInfo.length} torneos disponibles para procesar
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Torneos por año:</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {tournamentsInfo.slice(0, 10).map((tournament, index) => (
                    <div key={tournament.id} className="flex justify-between">
                      <span className="text-gray-600">{tournament.name}</span>
                      <span className="text-gray-800 font-medium">
                        {tournament.year} - {tournament.surface}/{tournament.modality}
                      </span>
                    </div>
                  ))}
                </div>
                {tournamentsInfo.length > 10 && (
                  <p className="text-xs text-gray-500 mt-2">
                    ... y {tournamentsInfo.length - 10} torneos más
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <div>
                <h3 className="font-semibold text-red-900">❌ No hay torneos</h3>
                <p className="text-sm text-red-800">
                  No se encontraron torneos en la base de datos
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estado de current_rankings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Tabla current_rankings
        </h2>
        
        {isLoadingRankings ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-gray-500">Verificando rankings...</span>
          </div>
        ) : rankingsInfo && rankingsInfo.length > 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
              <div>
                <h3 className="font-semibold text-green-900">✅ Datos de current_rankings disponibles</h3>
                <p className="text-sm text-green-800">
                  {rankingsInfo.length} registros de muestra encontrados
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
              <div>
                <h3 className="font-semibold text-yellow-900">⚠️ No hay datos en current_rankings</h3>
                <p className="text-sm text-yellow-800">
                  La tabla current_rankings está vacía
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estado de equipos */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Estructura de equipos
        </h2>
        
        {isLoadingTeams ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-gray-500">Verificando equipos...</span>
          </div>
        ) : teamsInfo && teamsInfo.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="w-6 h-6 text-blue-500 mr-3" />
                <div>
                  <h3 className="font-semibold text-blue-900">📊 Estructura de equipos</h3>
                  <p className="text-sm text-blue-800">
                    Muestra de {teamsInfo.length} equipos (primeros 5)
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Equipos y sus IDs:</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2 text-xs">
                  {teamsInfo.map((team: any) => (
                    <div key={team.id} className="flex justify-between items-center p-2 bg-white rounded border">
                      <span className="text-gray-600 font-medium">{team.name}</span>
                      <div className="text-right">
                        <div className="text-gray-800 font-mono">{team.id}</div>
                        <div className="text-gray-500">tipo: {typeof team.id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <div>
                <h3 className="font-semibold text-red-900">❌ No se encontraron equipos</h3>
                <p className="text-sm text-red-800">
                  No se pudo acceder a la tabla teams o está vacía
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h2>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleRegenerateData}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Regenerar team_season_points desde positions</span>
            </button>

            <button
              onClick={handleSyncRankings}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Sincronizar current_rankings</span>
            </button>

            <button
              onClick={() => refetchTable()}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualizar diagnóstico</span>
            </button>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Regenerar:</strong> Calcula team_season_points desde los datos brutos de positions</p>
            <p><strong>Sincronizar:</strong> Actualiza current_rankings desde team_season_points</p>
            <p><strong>Actualizar:</strong> Refresca el diagnóstico de las tablas</p>
          </div>
        </div>
      </div>

      {/* Debug adicional */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Debug adicional</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Información de torneos:</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                Revisa la consola del navegador (F12) para ver logs detallados del proceso de regeneración.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Si ves errores, compártelos para diagnosticar el problema.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Verificación manual:</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                También puedes verificar directamente en Supabase SQL Editor:
              </p>
              <div className="mt-2 bg-gray-100 rounded p-2 font-mono text-xs">
                SELECT COUNT(*) FROM team_season_points;
              </div>
              <div className="mt-2 bg-gray-100 rounded p-2 font-mono text-xs">
                SELECT * FROM team_season_points LIMIT 5;
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DatabaseDiagnosticPage
