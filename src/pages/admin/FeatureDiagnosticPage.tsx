import React, { useState } from 'react'
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  FileText,
  Code,
  Database,
  Settings,
  ExternalLink
} from 'lucide-react'
import { generateFeatureReport } from '../../utils/featureDetection'
import rankingService from '../../services/rankingService'
import toast from 'react-hot-toast'

const FeatureDiagnosticPage: React.FC = () => {
  const [report, setReport] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [systemDiagnostics, setSystemDiagnostics] = useState<any>(null)
  const [isSystemLoading, setIsSystemLoading] = useState(false)

  const generateReport = async () => {
    setIsGenerating(true)
    try {
      const result = generateFeatureReport()
      setReport(result)
    } catch (error) {
      console.error('Error generando reporte:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const runSystemDiagnostics = async () => {
    setIsSystemLoading(true)
    try {
      const result = await rankingService.diagnoseRanking()
      setSystemDiagnostics(result)
      toast.success('Diagnóstico del sistema completado')
    } catch (error) {
      console.error('Error en diagnóstico del sistema:', error)
      toast.error('Error al ejecutar diagnóstico del sistema')
    } finally {
      setIsSystemLoading(false)
    }
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diagnóstico de Funcionalidades</h1>
          <p className="text-gray-600">Detecta funcionalidades perdidas o incompletas</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generando...' : 'Generar Reporte'}
          </button>
          <button
            onClick={runSystemDiagnostics}
            disabled={isSystemLoading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSystemLoading ? 'animate-spin' : ''}`} />
            {isSystemLoading ? 'Diagnosticando...' : 'Diagnóstico del Sistema'}
          </button>
        </div>
      </div>

      {/* Diagnóstico del Sistema */}
      {systemDiagnostics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">Diagnóstico del Sistema</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Tablas de Base de Datos</h3>
                <div className="space-y-1">
                  {Object.entries(systemDiagnostics.tables || {}).map(([table, data]: [string, any]) => (
                    <div key={table} className="flex justify-between text-sm">
                      <span className="capitalize">{table.replace('_', ' ')}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        data.status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {data.totalRecords} registros
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Integridad de Datos</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Datos huérfanos:</span>
                    <span className={systemDiagnostics.dataIntegrity?.hasOrphans ? 'text-red-600' : 'text-green-600'}>
                      {systemDiagnostics.dataIntegrity?.hasOrphans ? 'Sí' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consistencia:</span>
                    <span className={systemDiagnostics.dataIntegrity?.rankingConsistency?.isConsistent ? 'text-green-600' : 'text-red-600'}>
                      {systemDiagnostics.dataIntegrity?.rankingConsistency?.isConsistent ? 'OK' : 'Inconsistente'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-medium text-purple-900 mb-2">Rendimiento</h3>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Tiempo de consulta:</span>
                    <span className="text-purple-600">
                      {systemDiagnostics.performance?.queryTime > 0 ? `${systemDiagnostics.performance.queryTime}ms` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {systemDiagnostics.recommendations && systemDiagnostics.recommendations.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Recomendaciones del Sistema:</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {systemDiagnostics.recommendations.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reporte */}
      {report && (
        <div className="space-y-6">
          {/* Completitud de Funcionalidades */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Completitud de Funcionalidades</h2>
              </div>
            </div>
            <div className="p-6">
              {Object.entries(report.completeness).map(([category, features]: [string, any]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-md font-medium text-gray-900 mb-3 capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(features).map(([feature, status]: [string, any]) => (
                      <div key={feature} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        {getStatusIcon(status)}
                        <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                          {feature.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Servicios No Utilizados */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-gray-900">Servicios No Utilizados</h2>
              </div>
            </div>
            <div className="p-6">
              {report.detection.unusedServices.length > 0 ? (
                <div className="space-y-3">
                  {report.detection.unusedServices.map((service: string) => (
                    <div key={service} className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm font-medium text-yellow-800">{service}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-800">
                    Todos los servicios están siendo utilizados
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900">Recomendaciones</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-red-600">1</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Verificar ordenamiento de rankings</h4>
                    <p className="text-sm text-gray-600">
                      Los rankings en /ranking aparecen desordenados. Revisar el método de recálculo automático.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-red-600">2</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Revisar consistencia de datos</h4>
                    <p className="text-sm text-gray-600">
                      Verificar que los datos en current_rankings tengan las posiciones correctas.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-yellow-600">3</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Limpiar servicios no utilizados</h4>
                    <p className="text-sm text-gray-600">
                      Considerar eliminar servicios que no se están utilizando para reducir el tamaño del bundle.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">4</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Implementar validaciones adicionales</h4>
                    <p className="text-sm text-gray-600">
                      Añadir validaciones de integridad de datos para prevenir inconsistencias futuras.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instrucciones */}
      {!report && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <FileText className="h-6 w-6 text-blue-500 mt-1" />
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Diagnóstico de Funcionalidades
              </h3>
              <p className="text-blue-700 mb-4">
                Esta herramienta analiza el código para detectar funcionalidades que podrían haberse perdido 
                durante los merges o que están incompletas.
              </p>
              <div className="space-y-2 text-sm text-blue-600">
                <p>• Verifica la completitud de funcionalidades principales</p>
                <p>• Identifica servicios no utilizados</p>
                <p>• Detecta código comentado o TODO items</p>
                <p>• Proporciona recomendaciones de mejora</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enlaces útiles */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Enlaces Útiles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/ranking"
            className="flex items-center space-x-2 p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Administración de Ranking</span>
          </a>
          <a
            href="/admin/tournaments"
            className="flex items-center space-x-2 p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Gestión de Torneos</span>
          </a>
        </div>
      </div>
    </div>
  )
}

export default FeatureDiagnosticPage
