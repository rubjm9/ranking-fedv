import React, { useState } from 'react'
import { debugRanking, testSeasonCalculation } from '../../utils/debugRanking'
import rankingService from '../../services/rankingService'
import toast from 'react-hot-toast'

const DebugRankingPage: React.FC = () => {
  const [debugResult, setDebugResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDebug = async () => {
    setIsLoading(true)
    try {
      const result = await debugRanking()
      setDebugResult(result)
      toast.success('Debug completado')
    } catch (error) {
      console.error('Error en debug:', error)
      toast.error('Error en debug')
    } finally {
      setIsLoading(false)
    }
  }

  const testCalculation = async () => {
    setIsLoading(true)
    try {
      const result = await testSeasonCalculation()
      setDebugResult(result)
      toast.success('Prueba de cálculo completada')
    } catch (error) {
      console.error('Error en prueba:', error)
      toast.error('Error en prueba')
    } finally {
      setIsLoading(false)
    }
  }

  const recalculateRanking = async () => {
    setIsLoading(true)
    try {
      const result = await rankingService.recalculateRankingAlternative()
      setDebugResult(result)
      toast.success('Ranking recalculado')
    } catch (error) {
      console.error('Error en recálculo:', error)
      toast.error('Error en recálculo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Debug del Sistema de Ranking</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={runDebug}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Ejecutando...' : 'Ejecutar Debug Completo'}
        </button>
        
        <button
          onClick={testCalculation}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 ml-4"
        >
          {isLoading ? 'Probando...' : 'Probar Cálculo de Temporadas'}
        </button>
        
        <button
          onClick={recalculateRanking}
          disabled={isLoading}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 ml-4"
        >
          {isLoading ? 'Recalculando...' : 'Recalcular Ranking'}
        </button>
      </div>

      {debugResult && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Resultado:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(debugResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default DebugRankingPage
