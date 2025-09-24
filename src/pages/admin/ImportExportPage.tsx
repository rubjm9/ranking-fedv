import React, { useState } from 'react'
import { Upload, Download, FileText, AlertCircle, X, Trash2, Eye, Save, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { importExportService } from '@/services/apiService'
import TournamentImportPage from '@/components/import/TournamentImportPage'
import * as XLSX from 'xlsx'


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
  const [activeTab, setActiveTab] = useState<'tournaments' | 'general' | 'export'>('tournaments')
  const [isExporting, setIsExporting] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'excel',
    dataType: 'all',
    dateRange: {
      start: '',
      end: ''
    },
    includeHistory: false
  })

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
        const csvContent = await generateCSVFromOptions(options)
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
          const excelData = await generateExcelDataFromOptions(options)
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

  const getDataTypeLabel = (type: string) => {
    switch (type) {
      case 'teams': return 'Equipos'
      case 'regions': return 'Regiones'
      case 'tournaments': return 'Torneos'
      case 'results': return 'Resultados'
      case 'positions': return 'Posiciones'
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
              onClick={() => setActiveTab('tournaments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tournaments'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              Importar Torneos
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              Importación General
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

      {/* Tournament Import Tab */}
      {activeTab === 'tournaments' && (
        <TournamentImportPage />
      )}

      {/* General Import Tab */}
      {activeTab === 'general' && (
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Importación General</h3>
            <p className="text-gray-600 mb-4">
              Esta funcionalidad está en desarrollo. Por ahora, usa la pestaña "Importar Torneos" para importar torneos específicamente.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Próximamente:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Importación de equipos</li>
                <li>• Importación de regiones</li>
                <li>• Importación masiva de resultados</li>
                <li>• Validación avanzada de datos</li>
              </ul>
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
                  <option value="regions">Solo regiones</option>
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
