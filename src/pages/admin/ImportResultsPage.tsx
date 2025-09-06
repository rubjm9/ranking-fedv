import React, { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { positionsService } from '@/services/apiService'

interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
  warnings: string[]
}

const ImportResultsPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isImporting, setIsImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const importMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tournamentId', tournamentId!)
      return positionsService.importResults(formData)
    },
    onSuccess: (result) => {
      setImportResult(result)
      queryClient.invalidateQueries({ queryKey: ['positions', 'tournament', tournamentId] })
      toast.success(`Importación completada: ${result.imported} resultados importados`)
    },
    onError: (error: any) => {
      console.error('Error al importar:', error)
      toast.error(error.response?.data?.message || 'Error al importar los resultados')
    }
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      previewFile(file)
    }
  }

  const previewFile = async (file: File) => {
    setIsImporting(true)
    try {
      // Simular preview - en producción sería una llamada real
      const mockData = [
        { team: 'Equipo A', position: 1, points: 1000 },
        { team: 'Equipo B', position: 2, points: 850 },
        { team: 'Equipo C', position: 3, points: 725 }
      ]
      setPreviewData(mockData)
      setShowPreview(true)
    } catch (error) {
      toast.error('Error al procesar el archivo')
    } finally {
      setIsImporting(false)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo')
      return
    }

    setIsImporting(true)
    try {
      await importMutation.mutateAsync(selectedFile)
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = `team,position,points
Equipo A,1,1000
Equipo B,2,850
Equipo C,3,725`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_resultados.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/admin/tournaments/${tournamentId}`)}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Importar Resultados</h1>
              <p className="text-gray-600">Importa resultados del torneo desde un archivo CSV</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Instrucciones</h3>
          <div className="space-y-3 text-blue-800">
            <p>• El archivo debe estar en formato CSV</p>
            <p>• Las columnas deben ser: <strong>team, position, points</strong></p>
            <p>• <strong>team</strong>: Nombre del equipo</p>
            <p>• <strong>position</strong>: Posición final (1, 2, 3, etc.)</p>
            <p>• <strong>points</strong>: Puntos obtenidos</p>
            <p>• Los equipos deben existir previamente en el sistema</p>
          </div>
        </div>

        {/* Descargar plantilla */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Descargar Plantilla</h3>
          <p className="text-gray-600 mb-4">
            Descarga la plantilla de ejemplo para ver el formato correcto del archivo.
          </p>
          <button
            onClick={downloadTemplate}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Descargar Plantilla CSV</span>
          </button>
        </div>

        {/* Subir archivo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Subir Archivo</h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!selectedFile ? (
              <div>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Arrastra tu archivo aquí o haz clic para seleccionar
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Seleccionar Archivo
                </button>
              </div>
            ) : (
              <div>
                <FileText className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-900 font-medium mb-2">{selectedFile.name}</p>
                <p className="text-gray-600 mb-4">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cambiar Archivo
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={isImporting}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isImporting ? 'Importando...' : 'Importar Resultados'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vista previa */}
        {showPreview && previewData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vista Previa</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posición</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Puntos</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.team}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.position}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resultado de importación */}
        {importResult && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resultado de la Importación</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-700">
                  {importResult.imported} resultados importados exitosamente
                </span>
              </div>
              
              {importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-2">Errores:</h4>
                  <ul className="space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="flex items-center space-x-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {importResult.warnings.length > 0 && (
                <div>
                  <h4 className="font-medium text-yellow-700 mb-2">Advertencias:</h4>
                  <ul className="space-y-1">
                    {importResult.warnings.map((warning, index) => (
                      <li key={index} className="flex items-center space-x-2 text-yellow-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImportResultsPage
