import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import simulateAllSubseasonRankings from '@/scripts/simulateSubseasonRankings'

const SimulateRankingsPage: React.FC = () => {
  const navigate = useNavigate()
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; processed: number } | null>(null)

  const handleSimulate = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      console.log('🚀 Iniciando simulación de rankings...')
      const simulationResult = await simulateAllSubseasonRankings()
      
      setResult(simulationResult)
      
      if (simulationResult.success) {
        toast.success(`Simulación completada: ${simulationResult.processed} registros procesados`)
      } else {
        toast.error(`Error en simulación: ${simulationResult.message}`)
      }
    } catch (error: any) {
      console.error('Error ejecutando simulación:', error)
      toast.error('Error ejecutando simulación: ' + error.message)
      setResult({
        success: false,
        message: error.message || 'Error desconocido',
        processed: 0
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver a administración
          </button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Simular Rankings por Subtemporada</h1>
            <p className="text-gray-600 mt-2">
              Generar rankings históricos para todas las subtemporadas basándose en los datos existentes
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">¿Qué hace esta simulación?</h3>
          <ul className="text-blue-800 space-y-2">
            <li>• <strong>Analiza todas las temporadas</strong> disponibles en la base de datos</li>
            <li>• <strong>Calcula rankings por subtemporada:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>- Subtemporada 1: Playa Mixto</li>
                <li>- Subtemporada 2: Playa Open/Women</li>
                <li>- Subtemporada 3: Césped Mixto</li>
                <li>- Subtemporada 4: Césped Open/Women</li>
              </ul>
            </li>
            <li>• <strong>Aplica coeficientes de antigüedad:</strong> 1.0, 0.8, 0.5, 0.2</li>
            <li>• <strong>Calcula ranking global final</strong> para cada temporada</li>
            <li>• <strong>Almacena los datos</strong> en las nuevas columnas de team_season_points</li>
          </ul>
        </div>

        {/* Warning Card */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Importante</h3>
              <p className="text-yellow-800">
                Esta operación puede tomar varios minutos dependiendo de la cantidad de temporadas y equipos. 
                Los datos existentes no se perderán, solo se agregarán los nuevos rankings.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ejecutar Simulación</h3>
              <p className="text-gray-600">
                Haz clic en el botón para comenzar la simulación de todos los rankings históricos
              </p>
            </div>
            <button
              onClick={handleSimulate}
              disabled={isRunning}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                isRunning
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRunning ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Ejecutar Simulación
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className={`rounded-lg p-6 border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start">
              {result.success ? (
                <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-0.5" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600 mr-3 mt-0.5" />
              )}
              <div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? 'Simulación Completada' : 'Error en Simulación'}
                </h3>
                <p className={`mb-2 ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.message}
                </p>
                {result.success && (
                  <p className="text-green-700 font-medium">
                    📊 Registros procesados: {result.processed}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Instrucciones</h3>
          <ol className="text-gray-700 space-y-2 list-decimal list-inside">
            <li>Asegúrate de que la migración de base de datos se haya ejecutado correctamente</li>
            <li>Verifica que tienes datos de temporadas en team_season_points</li>
            <li>Haz clic en "Ejecutar Simulación" para comenzar</li>
            <li>Espera a que se complete el proceso (puede tomar varios minutos)</li>
            <li>Revisa los resultados y verifica en la página de detalle de equipos</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default SimulateRankingsPage
