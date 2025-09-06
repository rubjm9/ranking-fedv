import React, { useState, useEffect } from 'react'
import { supabase } from '@/services/supabaseService'

const TestSupabasePage: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Probando...')
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    testSupabaseConnection()
  }, [])

  const testSupabaseConnection = async () => {
    try {
      console.log('🔍 Probando conexión con Supabase...')
      
      if (!supabase) {
        setError('Cliente de Supabase no inicializado - usando datos mock')
        setConnectionStatus('Modo desarrollo (datos mock)')
        
        // Mostrar datos mock como ejemplo
        const mockData = [
          { id: '1', name: 'Andalucía', coefficient: 1.0 },
          { id: '2', name: 'Cataluña', coefficient: 1.2 },
          { id: '3', name: 'Madrid', coefficient: 1.1 },
          { id: '4', name: 'Valencia', coefficient: 0.9 },
          { id: '5', name: 'País Vasco', coefficient: 1.0 }
        ]
        setData(mockData)
        return
      }
      
      // Probar conexión básica
      const { data: regionsData, error: regionsError } = await supabase
        .from('regions')
        .select('*')
        .limit(5)
      
      if (regionsError) {
        console.error('❌ Error de conexión:', regionsError)
        setError(regionsError.message)
        setConnectionStatus('Error de conexión')
        return
      }
      
      console.log('✅ Conexión exitosa con Supabase')
      console.log('📊 Datos recibidos:', regionsData)
      
      setConnectionStatus('Conexión exitosa')
      setData(regionsData)
      
    } catch (err: any) {
      console.error('❌ Error de conexión:', err)
      setError(err.message)
      setConnectionStatus('Error de conexión')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test de Conexión con Supabase
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Estado de la Conexión</h2>
          <div className={`p-4 rounded-lg ${
            connectionStatus === 'Conexión exitosa' 
              ? 'bg-green-100 text-green-800' 
              : connectionStatus === 'Error de conexión'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            <strong>{connectionStatus}</strong>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {data && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Datos de Prueba (Regiones)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coeficiente
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((region: any) => (
                    <tr key={region.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {region.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {region.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {region.coefficient}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <button
            onClick={testSupabaseConnection}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Probar Conexión Nuevamente
          </button>
          
          {connectionStatus === 'Error de conexión' && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
              <h3 className="font-semibold mb-2">Para conectar con Supabase:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Ve a <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">supabase.com/dashboard</a></li>
                <li>Selecciona tu proyecto: <code className="bg-gray-200 px-1 rounded">tseshbfijbarhjtayqmb</code></li>
                <li>Ve a <strong>Settings → API</strong></li>
                <li>Copia la clave <strong>"anon public"</strong> (NO la "service_role")</li>
                <li>Actualiza el archivo <code className="bg-gray-200 px-1 rounded">frontend/.env.local</code></li>
                <li>Reinicia el servidor</li>
              </ol>
            </div>
          )}
          
          {connectionStatus === 'Modo desarrollo (datos mock)' && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
              <h3 className="font-semibold mb-2">✅ Modo desarrollo activo</h3>
              <p className="text-sm">El sistema está funcionando con datos mock. Puedes usar:</p>
              <ul className="list-disc list-inside mt-2 text-sm">
                <li><strong>Email:</strong> admin@fedv.es</li>
                <li><strong>Contraseña:</strong> admin123</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestSupabasePage
