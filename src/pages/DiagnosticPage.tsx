import React, { useState, useEffect } from 'react'
import { diagnosticService } from '@/utils/diagnosticService'

const DiagnosticPage: React.FC = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDiagnostic = async () => {
    setIsLoading(true)
    try {
      const results = await diagnosticService.runFullDiagnostic()
      setDiagnosticResults(results)
    } catch (error) {
      console.error('Error ejecutando diagnóstico:', error)
      setDiagnosticResults({ success: false, error: 'Error ejecutando diagnóstico' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostic()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Diagnóstico del Sistema</h1>
          
          <div className="mb-6">
            <button
              onClick={runDiagnostic}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
            </button>
          </div>

          {diagnosticResults && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${diagnosticResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h2 className={`font-semibold ${diagnosticResults.success ? 'text-green-800' : 'text-red-800'}`}>
                  Estado General: {diagnosticResults.success ? '✅ Funcionando' : '❌ Error'}
                </h2>
                {diagnosticResults.error && (
                  <p className="text-red-600 mt-2">{diagnosticResults.error}</p>
                )}
              </div>

              {diagnosticResults.data && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(diagnosticResults.data).map(([table, info]: [string, any]) => (
                    <div key={table} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 capitalize mb-2">{table}</h3>
                      {info.error ? (
                        <div className="text-red-600">
                          <p>❌ Error: {info.error}</p>
                        </div>
                      ) : (
                        <div className="text-green-600">
                          <p>✅ Registros: {info.count}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Información del Entorno</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ No configurada'}</p>
              <p>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada'}</p>
              <p>Modo: {import.meta.env.MODE}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiagnosticPage


