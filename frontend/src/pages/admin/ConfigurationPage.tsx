import React, { useState, useEffect } from 'react'
import { Save, RefreshCw, Download, Upload, Settings, BarChart3, Target, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface Configuration {
  ce1Points: Record<number, number>
  ce2Points: Record<number, number>
  regionalPoints: Record<number, number>
  temporalWeights: Record<number, number>
  regionalCoefficient: {
    floor: number
    ceiling: number
    increment: number
  }
}

const ConfigurationPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [config, setConfig] = useState<Configuration>({
    ce1Points: {
      1: 1000, 2: 850, 3: 725, 4: 625, 5: 520, 6: 450, 7: 380, 8: 320,
      9: 270, 10: 230, 11: 195, 12: 165, 13: 140, 14: 120, 15: 105,
      16: 90, 17: 75, 18: 65, 19: 55, 20: 46, 21: 39, 22: 34, 23: 30, 24: 27
    },
    ce2Points: {
      1: 230, 2: 195, 3: 165, 4: 140, 5: 120, 6: 103, 7: 86, 8: 74,
      9: 63, 10: 54, 11: 46, 12: 39, 13: 34, 14: 29, 15: 25,
      16: 21, 17: 18, 18: 15, 19: 13, 20: 11, 21: 9, 22: 8, 23: 7, 24: 6
    },
    regionalPoints: {
      1: 140, 2: 120, 3: 100, 4: 85, 5: 72, 6: 60, 7: 50, 8: 42,
      9: 35, 10: 30, 11: 25, 12: 21, 13: 18, 14: 15, 15: 13,
      16: 11, 17: 9, 18: 8, 19: 7, 20: 6, 21: 5, 22: 4, 23: 3, 24: 2
    },
    temporalWeights: {
      0: 1.0,
      1: 0.8,
      2: 0.5,
      3: 0.2
    },
    regionalCoefficient: {
      floor: 0.8,
      ceiling: 1.2,
      increment: 0.01
    }
  })

  useEffect(() => {
    loadConfiguration()
  }, [])

  const loadConfiguration = async () => {
    setIsLoading(true)
    try {
      // Mock API call - en producción sería una llamada real
      await new Promise(resolve => setTimeout(resolve, 500))
      // setConfig(response.data)
      toast.success('Configuración cargada')
    } catch (error) {
      console.error('Error al cargar configuración:', error)
      toast.error('Error al cargar la configuración')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Mock API call - en producción sería una llamada real
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Configuración guardada exitosamente')
    } catch (error) {
      console.error('Error al guardar configuración:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (window.confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
      setConfig({
        ce1Points: {
          1: 1000, 2: 850, 3: 725, 4: 625, 5: 520, 6: 450, 7: 380, 8: 320,
          9: 270, 10: 230, 11: 195, 12: 165, 13: 140, 14: 120, 15: 105,
          16: 90, 17: 75, 18: 65, 19: 55, 20: 46, 21: 39, 22: 34, 23: 30, 24: 27
        },
        ce2Points: {
          1: 230, 2: 195, 3: 165, 4: 140, 5: 120, 6: 103, 7: 86, 8: 74,
          9: 63, 10: 54, 11: 46, 12: 39, 13: 34, 14: 29, 15: 25,
          16: 21, 17: 18, 18: 15, 19: 13, 20: 11, 21: 9, 22: 8, 23: 7, 24: 6
        },
        regionalPoints: {
          1: 140, 2: 120, 3: 100, 4: 85, 5: 72, 6: 60, 7: 50, 8: 42,
          9: 35, 10: 30, 11: 25, 12: 21, 13: 18, 14: 15, 15: 13,
          16: 11, 17: 9, 18: 8, 19: 7, 20: 6, 21: 5, 22: 4, 23: 3, 24: 2
        },
        temporalWeights: {
          0: 1.0,
          1: 0.8,
          2: 0.5,
          3: 0.2
        },
        regionalCoefficient: {
          floor: 0.8,
          ceiling: 1.2,
          increment: 0.01
        }
      })
      toast.success('Configuración restaurada')
    }
  }

  const handlePointChange = (division: keyof Configuration, position: number, value: string) => {
    const numValue = parseFloat(value) || 0
    setConfig(prev => ({
      ...prev,
      [division]: {
        ...prev[division],
        [position]: numValue
      }
    }))
  }

  const handleWeightChange = (year: number, value: string) => {
    const numValue = parseFloat(value) || 0
    setConfig(prev => ({
      ...prev,
      temporalWeights: {
        ...prev.temporalWeights,
        [year]: numValue
      }
    }))
  }

  const handleCoefficientChange = (field: keyof Configuration['regionalCoefficient'], value: string) => {
    const numValue = parseFloat(value) || 0
    setConfig(prev => ({
      ...prev,
      regionalCoefficient: {
        ...prev.regionalCoefficient,
        [field]: numValue
      }
    }))
  }

  const renderPointsTable = (division: keyof Configuration, title: string, maxPositions: number) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
        {Array.from({ length: maxPositions }, (_, i) => i + 1).map(position => (
          <div key={position} className="text-center">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {position}º
            </label>
            <input
              type="number"
              value={config[division][position] || 0}
              onChange={(e) => handlePointChange(division, position, e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="0"
              step="1"
            />
          </div>
        ))}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Cargando configuración...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
            <p className="text-gray-600">Gestionar parámetros del sistema de ranking</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadConfiguration}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recargar
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Restaurar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Points Tables */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Tablas de Puntos
          </h2>
          
          {renderPointsTable('ce1Points', 'Campeonato España 1ª División', 24)}
          {renderPointsTable('ce2Points', 'Campeonato España 2ª División', 24)}
          {renderPointsTable('regionalPoints', 'Campeonatos Regionales', 24)}
        </div>

        {/* Temporal Weights */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Pesos Temporales
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Multiplicadores aplicados según la antigüedad de los resultados
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(config.temporalWeights).map(([year, weight]) => (
              <div key={year}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {year === '0' ? 'Año actual' : `${year} año${year === '1' ? '' : 's'} atrás`}
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => handleWeightChange(parseInt(year), e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                  max="2"
                  step="0.1"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Regional Coefficient */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Coeficiente Regional
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Configuración para el cálculo automático de coeficientes regionales
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Límite Inferior
              </label>
              <input
                type="number"
                value={config.regionalCoefficient.floor}
                onChange={(e) => handleCoefficientChange('floor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
                max="2"
                step="0.1"
              />
              <p className="mt-1 text-xs text-gray-500">Valor mínimo del coeficiente</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Límite Superior
              </label>
              <input
                type="number"
                value={config.regionalCoefficient.ceiling}
                onChange={(e) => handleCoefficientChange('ceiling', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
                max="2"
                step="0.1"
              />
              <p className="mt-1 text-xs text-gray-500">Valor máximo del coeficiente</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Incremento
              </label>
              <input
                type="number"
                value={config.regionalCoefficient.increment}
                onChange={(e) => handleCoefficientChange('increment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0.001"
                max="0.1"
                step="0.001"
              />
              <p className="mt-1 text-xs text-gray-500">Paso de ajuste del coeficiente</p>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Información del Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Versión:</span>
              <span className="ml-2 text-gray-600">1.0.0</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Última actualización:</span>
              <span className="ml-2 text-gray-600">{new Date().toLocaleDateString()}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Equipos registrados:</span>
              <span className="ml-2 text-gray-600">156</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Torneos activos:</span>
              <span className="ml-2 text-gray-600">23</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfigurationPage
