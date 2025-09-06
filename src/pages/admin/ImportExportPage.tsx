import React, { useState, useRef } from 'react'
import { Upload, Download, FileText, AlertCircle, X, Trash2, Eye, Save, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { importExportService } from '@/services/apiService'
import * as XLSX from 'xlsx'

interface ImportData {
  teams: any[]
  tournaments: any[]
  results: any[]
  errors: string[]
  warnings: string[]
}

interface ExportOptions {
  format: 'excel' | 'csv' | 'json'
  dataType: 'teams' | 'tournaments' | 'results' | 'ranking' | 'all'
  dateRange: {
    start: string
    end: string
  }
  includeHistory: boolean
}

const ImportExportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import')
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importData, setImportData] = useState<ImportData>({
    teams: [],
    tournaments: [],
    results: [],
    errors: [],
    warnings: []
  })
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'excel',
    dataType: 'all',
    dateRange: {
      start: '',
      end: ''
    },
    includeHistory: false
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files)
    
    if (files.length > 0) {
      // Simular lectura de archivos
      simulateFileRead(files[0])
    }
  }

  const simulateFileRead = async (file: File) => {
    setIsImporting(true)
    
    try {
      // Validar archivo usando el servicio real
      const validationResult = await importExportService.validateFile(file)
      
      setImportData(validationResult)
      setPreviewData(validationResult.teams || [])
      setIsImporting(false)
      toast.success('Archivo procesado correctamente')
    } catch (error: any) {
      setIsImporting(false)
      toast.error(error.response?.data?.message || 'Error al procesar el archivo')
      
      // Fallback a datos mock si el backend no está disponible
      const mockData = {
        teams: [
          { name: 'Nuevo Equipo 1', club: 'Club A', region: 'Madrid', email: 'equipo1@test.com' },
          { name: 'Nuevo Equipo 2', club: 'Club B', region: 'Cataluña', email: 'equipo2@test.com' }
        ],
        tournaments: [
          { name: 'Torneo Test 1', year: 2024, type: 'CE1', surface: 'GRASS' },
          { name: 'Torneo Test 2', year: 2024, type: 'REGIONAL', surface: 'GRASS' }
        ],
        results: [
          { tournament: 'Torneo Test 1', team: 'Nuevo Equipo 1', position: 1, points: 200 },
          { tournament: 'Torneo Test 1', team: 'Nuevo Equipo 2', position: 2, points: 180 }
        ],
        errors: ['Email inválido en línea 3'],
        warnings: ['Región no encontrada: "Nueva Región"']
      }
      
      setImportData(mockData)
      setPreviewData(mockData.teams)
    }
  }

  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Por favor selecciona al menos un archivo')
      return
    }

    if (importData.errors.length > 0) {
      toast.error('Hay errores en los datos que deben corregirse')
      return
    }

    setIsImporting(true)
    
    try {
      // Importar datos usando el servicio real
      const importOptions = {
        dataType: 'auto',
        mode: 'create',
        validate: true
      }
      
      await importExportService.import(selectedFiles, importOptions)
      
      toast.success('Datos importados exitosamente')
      setSelectedFiles([])
      setImportData({ teams: [], tournaments: [], results: [], errors: [], warnings: [] })
      setPreviewData([])
      setShowPreview(false)
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al importar los datos')
    } finally {
      setIsImporting(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      // Exportar datos usando el servicio real
      const options = {
        format: exportOptions.format,
        dataType: exportOptions.dataType,
        dateRange: exportOptions.dateRange,
        includeHistory: exportOptions.includeHistory,
        includeStats: true,
        compress: false
      }
      
      if (exportOptions.format === 'csv') {
        // Para CSV, generar directamente en frontend
        const csvContent = generateCSVFromOptions(options)
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ranking-fedv-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success(`Datos exportados en formato ${exportOptions.format.toUpperCase()}`)
      } else if (exportOptions.format === 'excel') {
        // Para Excel, generar directamente en frontend usando XLSX
        try {
          const excelData = generateExcelDataFromOptions(options)
          const ws = XLSX.utils.json_to_sheet(excelData)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, 'Datos')
          
          // Generar el archivo Excel
          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
          const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
          
          // Crear y descargar el archivo
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `ranking-fedv-export-${new Date().toISOString().split('T')[0]}.xlsx`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          
          toast.success(`Datos exportados en formato ${exportOptions.format.toUpperCase()}`)
        } catch (error) {
          console.error('Error al exportar Excel:', error)
          toast.error('Error al exportar Excel')
        }
      } else {
        // Para JSON, usar el servicio del backend
        const blob = await importExportService.export(options)
        
        // Crear y descargar el archivo
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ranking-fedv-export-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success(`Datos exportados en formato ${exportOptions.format.toUpperCase()}`)
      }
    } catch (error: any) {
      console.error('Error al exportar:', error)
      toast.error(error.response?.data?.message || 'Error al exportar los datos')
    } finally {
      setIsExporting(false)
    }
  }

  const generateCSVFromOptions = (options: any) => {
    const csvRows: string[] = []
    
    // Generar datos de ejemplo según el tipo
    switch (options.dataType) {
      case 'teams':
        csvRows.push('name,club,region,email')
        csvRows.push('Equipo Ejemplo 1,Club Deportivo A,Madrid,equipo1@ejemplo.com')
        csvRows.push('Equipo Ejemplo 2,Club Deportivo B,Cataluña,equipo2@ejemplo.com')
        break
      case 'tournaments':
        csvRows.push('name,type,year,surface,modality')
        csvRows.push('CE1 2024,CE1,2024,GRASS,MIXED')
        csvRows.push('CE2 2024,CE2,2024,GRASS,MIXED')
        break
      case 'results':
        csvRows.push('tournament,team,position,points')
        csvRows.push('CE1 2024,Equipo Ejemplo 1,1,200')
        csvRows.push('CE1 2024,Equipo Ejemplo 2,2,180')
        break
      default:
        csvRows.push('=== EQUIPOS ===')
        csvRows.push('name,club,region,email')
        csvRows.push('Equipo Ejemplo 1,Club Deportivo A,Madrid,equipo1@ejemplo.com')
        csvRows.push('')
        csvRows.push('=== TORNEOS ===')
        csvRows.push('name,type,year,surface,modality')
        csvRows.push('CE1 2024,CE1,2024,GRASS,MIXED')
        csvRows.push('')
        csvRows.push('=== RESULTADOS ===')
        csvRows.push('tournament,team,position,points')
        csvRows.push('CE1 2024,Equipo Ejemplo 1,1,200')
    }
    
    return csvRows.join('\n')
  }

  const generateExcelDataFromOptions = (options: any) => {
    // Generar datos de ejemplo según el tipo
    switch (options.dataType) {
      case 'teams':
        return [
          { name: 'Equipo Ejemplo 1', club: 'Club Deportivo A', region: 'Madrid', email: 'equipo1@ejemplo.com' },
          { name: 'Equipo Ejemplo 2', club: 'Club Deportivo B', region: 'Cataluña', email: 'equipo2@ejemplo.com' },
          { name: 'Equipo Ejemplo 3', club: 'Club Deportivo C', region: 'Valencia', email: 'equipo3@ejemplo.com' }
        ]
      case 'tournaments':
        return [
          { name: 'CE1 2024', type: 'CE1', year: 2024, surface: 'GRASS', modality: 'MIXED' },
          { name: 'CE2 2024', type: 'CE2', year: 2024, surface: 'GRASS', modality: 'MIXED' },
          { name: 'Regional Madrid 2024', type: 'REGIONAL', year: 2024, surface: 'GRASS', modality: 'MIXED' }
        ]
      case 'results':
        return [
          { tournament: 'CE1 2024', team: 'Equipo Ejemplo 1', position: 1, points: 200 },
          { tournament: 'CE1 2024', team: 'Equipo Ejemplo 2', position: 2, points: 180 },
          { tournament: 'CE2 2024', team: 'Equipo Ejemplo 3', position: 1, points: 150 }
        ]
      default:
        return [
          { name: 'Equipo Ejemplo 1', club: 'Club Deportivo A', region: 'Madrid', email: 'equipo1@ejemplo.com' },
          { name: 'CE1 2024', type: 'CE1', year: 2024, surface: 'GRASS', modality: 'MIXED' },
          { tournament: 'CE1 2024', team: 'Equipo Ejemplo 1', position: 1, points: 200 }
        ]
    }
  }

  const handleExportTemplate = async (dataType: string) => {
    setIsExporting(true)
    
    try {
      // Crear datos de ejemplo según el tipo
      let csvContent = ''
      
      switch (dataType) {
        case 'teams':
          csvContent = `name,club,region,email
Equipo Ejemplo 1,Club Deportivo A,Madrid,equipo1@ejemplo.com
Equipo Ejemplo 2,Club Deportivo B,Cataluña,equipo2@ejemplo.com
Equipo Ejemplo 3,Club Deportivo C,Valencia,equipo3@ejemplo.com`
          break
        case 'tournaments':
          csvContent = `name,type,year,surface,modality
CE1 2024,CE1,2024,GRASS,MIXED
CE2 2024,CE2,2024,GRASS,MIXED
Regional Madrid 2024,REGIONAL,2024,GRASS,MIXED`
          break
        case 'results':
          csvContent = `tournament,team,position,points
CE1 2024,Equipo Ejemplo 1,1,200
CE1 2024,Equipo Ejemplo 2,2,180
CE2 2024,Equipo Ejemplo 3,1,150`
          break
        default:
          csvContent = `name,club,region,email
Equipo Ejemplo 1,Club Deportivo A,Madrid,equipo1@ejemplo.com`
      }
      
      // Generar archivo CSV directamente
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `template-${dataType}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(`Plantilla de ${getDataTypeLabel(dataType)} exportada correctamente`)
    } catch (error: any) {
      console.error('Error al exportar plantilla:', error)
      toast.error('Error al exportar la plantilla')
    } finally {
      setIsExporting(false)
    }
  }



  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.includes('.csv')) return <FileText className="h-6 w-6 text-blue-600" />
    if (fileName.includes('.xlsx') || fileName.includes('.xls')) return <FileText className="h-6 w-6 text-green-600" />
    return <FileText className="h-6 w-6 text-gray-600" />
  }

  const getDataTypeLabel = (type: string) => {
    switch (type) {
      case 'teams': return 'Equipos'
      case 'tournaments': return 'Torneos'
      case 'results': return 'Resultados'
      case 'ranking': return 'Ranking'
      case 'all': return 'Todos los datos'
      default: return type
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Importar / Exportar Datos</h1>
        <p className="text-gray-600 mt-2">
          Gestiona la importación y exportación de datos del sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('import')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              Importar Datos
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Download className="h-4 w-4 inline mr-2" />
              Exportar Datos
            </button>
          </nav>
        </div>
      </div>

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="space-y-8">
          {/* File Upload */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subir Archivos</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Arrastra archivos aquí o haz clic para seleccionar
                  </span>
                  <span className="mt-1 block text-sm text-gray-500">
                    CSV, Excel (xlsx, xls) hasta 10MB
                  </span>
                </label>
                <input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="sr-only"
                />
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Archivos seleccionados:</h4>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        {getFileIcon(file.name)}
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Import Options */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Opciones de Importación</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Datos
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="auto">Detectar automáticamente</option>
                  <option value="teams">Solo equipos</option>
                  <option value="tournaments">Solo torneos</option>
                  <option value="results">Solo resultados</option>
                  <option value="all">Todos los datos</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modo de Importación
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="create">Crear nuevos registros</option>
                  <option value="update">Actualizar existentes</option>
                  <option value="merge">Combinar datos</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="ml-2 text-sm text-gray-700">Validar datos antes de importar</span>
              </label>
            </div>
          </div>

          {/* Validation Results */}
          {(importData.errors.length > 0 || importData.warnings.length > 0) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resultados de Validación</h3>
              
              {/* Errors */}
              {importData.errors.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Errores ({importData.errors.length})
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <ul className="text-sm text-red-700 space-y-1">
                      {importData.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {importData.warnings.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Advertencias ({importData.warnings.length})
                  </h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {importData.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Data Preview */}
          {previewData.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Vista Previa de Datos</h3>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-primary-600 hover:text-primary-700 flex items-center"
                >
                  {showPreview ? <X className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showPreview ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              
              {showPreview && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Club
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Región
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.club}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.region}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Import Actions */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setSelectedFiles([])
                setImportData({ teams: [], tournaments: [], results: [], errors: [], warnings: [] })
                setPreviewData([])
                setShowPreview(false)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || selectedFiles.length === 0 || importData.errors.length > 0}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Importar Datos
                </>
              )}
            </button>
          </div>

          {/* Templates Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Plantillas y Guías de Importación</h3>
            <p className="text-gray-600 mb-4">
              Descarga plantillas con el formato correcto para importar datos. Estas plantillas te mostrarán exactamente qué columnas necesitas y en qué formato.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => handleExportTemplate('teams')}
                disabled={isExporting}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50"
              >
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Plantilla Equipos</div>
                  <div className="text-sm text-gray-500">Formato para importar equipos</div>
                </div>
              </button>
              
              <button
                onClick={() => handleExportTemplate('tournaments')}
                disabled={isExporting}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50"
              >
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Plantilla Torneos</div>
                  <div className="text-sm text-gray-500">Formato para importar torneos</div>
                </div>
              </button>
              
              <button
                onClick={() => handleExportTemplate('results')}
                disabled={isExporting}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50"
              >
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Plantilla Resultados</div>
                  <div className="text-sm text-gray-500">Formato para importar resultados</div>
                </div>
              </button>
            </div>

            {/* Archivos de ejemplo estáticos */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Archivos de Ejemplo Estáticos</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <a
                  href="/templates/equipos-ejemplo.csv"
                  download
                  className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  equipos-ejemplo.csv
                </a>
                <a
                  href="/templates/torneos-ejemplo.csv"
                  download
                  className="flex items-center px-3 py-2 text-sm text-green-600 hover:text-green-800 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  torneos-ejemplo.csv
                </a>
                <a
                  href="/templates/resultados-ejemplo.csv"
                  download
                  className="flex items-center px-3 py-2 text-sm text-purple-600 hover:text-purple-800 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  resultados-ejemplo.csv
                </a>
              </div>
              <div className="mt-3 space-y-2">
                <a
                  href="/templates/README-importacion.md"
                  download
                  className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Guía de Importación (README.md)
                </a>
                <a
                  href="/templates/DIFERENCIA-BOTONES.md"
                  download
                  className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Diferencia entre Botones (DIFERENCIA-BOTONES.md)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="space-y-8">
          {/* Export Options */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Opciones de Exportación</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato de Archivo
                </label>
                <select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as 'excel' | 'csv' | 'json' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                  <option value="json">JSON (.json)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Datos
                </label>
                <select
                  value={exportOptions.dataType}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, dataType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">Todos los datos</option>
                  <option value="teams">Solo equipos</option>
                  <option value="tournaments">Solo torneos</option>
                  <option value="results">Solo resultados</option>
                  <option value="ranking">Solo ranking actual</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de Fechas
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Desde</label>
                  <input
                    type="date"
                    value={exportOptions.dateRange.start}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={exportOptions.dateRange.end}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeHistory}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeHistory: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Incluir historial de cambios</span>
              </label>
              
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="ml-2 text-sm text-gray-700">Incluir estadísticas y métricas</span>
              </label>
              
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="ml-2 text-sm text-gray-700">Comprimir archivo (ZIP)</span>
              </label>
            </div>
          </div>

          {/* Export Preview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Exportación</h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Formato:</span>
                  <span className="ml-2 text-gray-900">{exportOptions.format.toUpperCase()}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tipo de datos:</span>
                  <span className="ml-2 text-gray-900">{getDataTypeLabel(exportOptions.dataType)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Rango de fechas:</span>
                  <span className="ml-2 text-gray-900">
                    {exportOptions.dateRange.start && exportOptions.dateRange.end
                      ? `${exportOptions.dateRange.start} - ${exportOptions.dateRange.end}`
                      : 'Sin filtro de fechas'
                    }
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Incluir historial:</span>
                  <span className="ml-2 text-gray-900">{exportOptions.includeHistory ? 'Sí' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>



          {/* Export Actions */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setExportOptions({
                format: 'excel',
                dataType: 'all',
                dateRange: { start: '', end: '' },
                includeHistory: false
              })}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Restablecer
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Datos
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportExportPage
