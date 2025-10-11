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
  Settings
} from 'lucide-react'
import { generateFeatureReport } from '../../utils/featureDetection'

const FeatureDiagnosticPage: React.FC = () => {
  const [report, setReport] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

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
        <button
          onClick={generateReport}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Generando...' : 'Generar Reporte'}
        </button>
      </div>

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
    </div>
  )
}

export default FeatureDiagnosticPage
