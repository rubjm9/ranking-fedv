import React from 'react'
import { Settings, Save, RotateCcw, Download, Upload } from 'lucide-react'

const ConfigurationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600">Ajusta los parámetros del sistema de ranking</p>
        </div>
        
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Valores
          </button>
          <button className="btn-primary">
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Points Tables */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tablas de Puntos</h2>
          <p className="text-gray-600 mb-4">
            Configura los puntos otorgados por posición en cada tipo de torneo.
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">CE1 - 1ª División</h3>
              <p className="text-sm text-gray-600">Puntos por posición (1-24)</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">CE2 - 2ª División</h3>
              <p className="text-sm text-gray-600">Puntos por posición (1-24)</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Regional</h3>
              <p className="text-sm text-gray-600">Puntos por posición (1-24)</p>
            </div>
          </div>
        </div>

        {/* Temporal Weights */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ponderación Temporal</h2>
          <p className="text-gray-600 mb-4">
            Ajusta los factores de peso para cada año en el cálculo del ranking.
          </p>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Año actual</span>
              <input
                type="number"
                step="0.1"
                defaultValue="1.0"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Año -1</span>
              <input
                type="number"
                step="0.1"
                defaultValue="0.8"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Año -2</span>
              <input
                type="number"
                step="0.1"
                defaultValue="0.5"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Año -3</span>
              <input
                type="number"
                step="0.1"
                defaultValue="0.2"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>

        {/* Regional Coefficient */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Coeficiente Regional</h2>
          <p className="text-gray-600 mb-4">
            Configura los parámetros para el cálculo del coeficiente regional.
          </p>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Floor (mínimo)</span>
              <input
                type="number"
                step="0.01"
                defaultValue="0.8"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Ceiling (máximo)</span>
              <input
                type="number"
                step="0.01"
                defaultValue="1.2"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Increment</span>
              <input
                type="number"
                step="0.001"
                defaultValue="0.01"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Respaldo y Restauración</h2>
          <p className="text-gray-600 mb-4">
            Gestiona las copias de seguridad de la configuración.
          </p>
          
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Download className="h-4 w-4 text-blue-500 mr-2" />
              Descargar configuración actual
            </button>
            
            <button className="w-full flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Upload className="h-4 w-4 text-green-500 mr-2" />
              Restaurar desde archivo
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Validación</h2>
        <p className="text-gray-600">
          Esta página permitirá configurar todos los parámetros del sistema, incluyendo:
        </p>
        <ul className="mt-4 space-y-2 text-gray-600">
          <li>• Tablas de puntos para cada tipo de torneo</li>
          <li>• Factores de ponderación temporal</li>
          <li>• Parámetros del coeficiente regional</li>
          <li>• Validación de configuración</li>
          <li>• Respaldo y restauración de configuraciones</li>
          <li>• Historial de cambios</li>
        </ul>
      </div>
    </div>
  )
}

export default ConfigurationPage
