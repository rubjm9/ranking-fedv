import React from 'react'
import { Upload, Download, FileText, FileSpreadsheet, Database } from 'lucide-react'

const ImportExportPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importar / Exportar</h1>
          <p className="text-gray-600">Gestiona la importación y exportación de datos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Importar Datos</h2>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Arrastra archivos aquí o haz clic para seleccionar</p>
              <p className="text-sm text-gray-500">Soporta CSV y Excel (.xlsx)</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Tipos de importación:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Resultados de torneos</li>
                <li>• Lista de equipos</li>
                <li>• Información de regiones</li>
                <li>• Configuración del sistema</li>
              </ul>
            </div>
            
            <button className="w-full btn-primary">
              <FileText className="h-4 w-4 mr-2" />
              Descargar plantilla
            </button>
          </div>
        </div>

        {/* Export Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Exportar Datos</h2>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <FileSpreadsheet className="h-5 w-5 text-green-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Ranking actual</p>
                    <p className="text-sm text-gray-600">Excel con posiciones y puntos</p>
                  </div>
                </div>
                <Download className="h-4 w-4 text-gray-400" />
              </button>
              
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <Database className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Datos completos</p>
                    <p className="text-sm text-gray-600">Backup de toda la base de datos</p>
                  </div>
                </div>
                <Download className="h-4 w-4 text-gray-400" />
              </button>
              
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-purple-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Reporte PDF</p>
                    <p className="text-sm text-gray-600">Ranking en formato PDF</p>
                  </div>
                </div>
                <Download className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Imports */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Importaciones Recientes</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Archivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registros
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  resultados_ce1_2024.csv
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  Resultados
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  Hace 2 horas
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Completado
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  24 registros
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  equipos_nuevos.xlsx
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  Equipos
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  Hace 1 día
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Completado
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  8 registros
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información</h2>
        <p className="text-gray-600">
          Esta página permitirá gestionar la importación y exportación de datos, incluyendo:
        </p>
        <ul className="mt-4 space-y-2 text-gray-600">
          <li>• Importar resultados de torneos desde CSV/Excel</li>
          <li>• Backup y restauración de datos</li>
          <li>• Plantillas para importación</li>
          <li>• Historial de importaciones</li>
          <li>• Validación de datos importados</li>
        </ul>
      </div>
    </div>
  )
}

export default ImportExportPage
