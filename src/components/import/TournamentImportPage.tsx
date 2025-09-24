import React, { useState } from 'react'
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { tournamentImportService, TournamentImportRow } from '@/services/tournamentImportService'
import toast from 'react-hot-toast'

const TournamentImportPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [importData, setImportData] = useState<TournamentImportRow[]>([])
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: string[] } | null>(null)
  const [importResult, setImportResult] = useState<any>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setIsProcessing(true)

    try {
      const data = await tournamentImportService.parseImportFile(file)
      console.log('Datos parseados:', data)
      setImportData(data)
      
      // Validar datos inmediatamente
      const validation = await tournamentImportService.validateImportData(data)
      console.log('Resultado de validación:', validation)
      setValidationResult(validation)
      
    } catch (error) {
      console.error('Error al procesar archivo:', error)
      toast.error('Error al procesar el archivo')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (!validationResult?.isValid) {
      toast.error('Por favor corrige los errores antes de importar')
      return
    }

    setIsProcessing(true)

    try {
      const result = await tournamentImportService.importTournaments(importData)
      setImportResult(result)
      
      if (result.success) {
        if (result.data?.errors && result.data.errors.length > 0) {
          toast.success(result.message, { duration: 6000 })
        } else {
          toast.success(result.message)
        }
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error al importar:', error)
      toast.error('Error durante la importación')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    tournamentImportService.generateTemplate()
    toast.success('Plantilla descargada')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Importar torneos</h1>
        <p className="text-gray-600">Importa múltiples torneos desde un archivo Excel</p>
      </div>

      {/* Template Download */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Plantilla de importación</h3>
              <p className="text-sm text-blue-700">
                Descarga la plantilla Excel con el formato correcto para importar torneos
              </p>
            </div>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar plantilla
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Subir archivo</h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <span className="text-lg font-medium text-gray-900 mb-2">
              Selecciona un archivo Excel
            </span>
            <span className="text-sm text-gray-500">
              Formatos soportados: .xlsx, .xls
            </span>
          </label>
        </div>

        {selectedFile && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
              <span className="text-sm text-gray-500 ml-2">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
            <span className="text-sm text-yellow-800">Procesando archivo...</span>
          </div>
        </div>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resultado de validación</h3>
          
          {validationResult.isValid ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">
                ✅ Datos válidos - {importData.length} torneo(s) listo(s) para importar
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center text-red-600">
                <XCircle className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">
                  ❌ Se encontraron {validationResult.errors.length} error(es)
                </span>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-900 mb-2">Errores encontrados:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <li key={index} className="flex items-start">
                      <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Button */}
      {validationResult?.isValid && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Importar datos</h3>
              <p className="text-sm text-gray-600">
                Se crearán {importData.length} torneo(s) con sus posiciones
              </p>
            </div>
            <button
              onClick={handleImport}
              disabled={isProcessing}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar torneos
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Import Results */}
      {importResult && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resultado de importación</h3>
          
          {importResult.success ? (
            <div className="space-y-4">
              <div className={`flex items-center ${importResult.data?.errors && importResult.data.errors.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">
                  {importResult.data?.errors && importResult.data.errors.length > 0 ? '⚠️ Importación completada con advertencias' : '✅ Importación completada exitosamente'}
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Resumen:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Torneos creados: {importResult.data?.tournamentsCreated || 0}</li>
                  <li>• Posiciones creadas: {importResult.data?.positionsCreated || 0}</li>
                  {importResult.data?.errors && importResult.data.errors.length > 0 && (
                    <li>• Advertencias: {importResult.data.errors.length}</li>
                  )}
                </ul>
              </div>

              {importResult.data?.errors && importResult.data.errors.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-orange-900 mb-2">Advertencias:</h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    {importResult.data.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center text-red-600">
                <XCircle className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">❌ Error en importación</span>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-900 mb-2">Errores:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {importResult.data?.errors?.map((error: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Instrucciones de uso</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>1.</strong> Descarga la plantilla Excel</p>
          <p><strong>2.</strong> Completa la información de cada torneo en una fila</p>
          <p><strong>3.</strong> Para las posiciones, escribe el nombre exacto del equipo</p>
          <p><strong>4.</strong> Sube el archivo completado</p>
          <p><strong>5.</strong> Revisa la validación y corrige errores si es necesario</p>
          <p><strong>6.</strong> Haz clic en "Importar torneos"</p>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Notas importantes:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Un torneo por fila</li>
            <li>• Las posiciones se asignan automáticamente según el orden de las columnas</li>
            <li>• Los nombres de equipos deben coincidir exactamente con los registrados</li>
            <li>• Para torneos regionales, la región es obligatoria</li>
            <li>• Las fechas deben estar en formato YYYY-MM-DD</li>
            <li>• Soporte para hasta 30 posiciones (torneos regionales)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TournamentImportPage
