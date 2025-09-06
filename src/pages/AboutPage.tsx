import React from 'react'
import { Trophy, Calculator, MapPin, Award } from 'lucide-react'

const AboutPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Sobre el Sistema de Ranking FEDV
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          El sistema oficial de ranking de Ultimate Frisbee en España, diseñado para 
          proporcionar una clasificación justa y transparente de todos los equipos.
        </p>
      </div>

      {/* How it works */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">¿Cómo funciona?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Puntos por posición</h3>
            <p className="text-gray-600">
              Cada posición en los torneos otorga puntos según tablas oficiales FEDV, 
              diferenciando entre CE1, CE2 y Regional.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ponderación temporal</h3>
            <p className="text-gray-600">
              Los resultados más recientes tienen mayor peso: año actual (x1.0), 
              año anterior (x0.8), etc.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Coeficiente regional</h3>
            <p className="text-gray-600">
              Se aplica un coeficiente según el rendimiento de cada región, 
              ajustando los puntos regionales.
            </p>
          </div>
        </div>
      </div>

      {/* Tournament Types */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Tipos de Torneos</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Award className="h-6 w-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">CE1 - 1ª División</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Campeonato de España de primera división, el torneo más importante del país.
            </p>
            <div className="text-sm text-gray-500">
              <p>1º lugar: 1000 puntos</p>
              <p>2º lugar: 850 puntos</p>
              <p>3º lugar: 750 puntos</p>
              <p>...</p>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Award className="h-6 w-6 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">CE2 - 2ª División</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Campeonato de España de segunda división, torneo de ascenso.
            </p>
            <div className="text-sm text-gray-500">
              <p>1º lugar: 230 puntos</p>
              <p>2º lugar: 195 puntos</p>
              <p>3º lugar: 172 puntos</p>
              <p>...</p>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Award className="h-6 w-6 text-orange-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Regional</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Torneos regionales organizados por las federaciones autonómicas.
            </p>
            <div className="text-sm text-gray-500">
              <p>1º lugar: 140 puntos</p>
              <p>2º lugar: 119 puntos</p>
              <p>3º lugar: 105 puntos</p>
              <p>...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Temporal Weights */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Ponderación Temporal</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Año
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Factor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Año actual
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  x1.0
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  Peso completo para resultados del año en curso
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Año -1
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  x0.8
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  80% del peso para resultados del año anterior
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Año -2
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  x0.5
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  50% del peso para resultados de hace dos años
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Año -3
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  x0.2
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  20% del peso para resultados de hace tres años
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Regional Coefficient */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Coeficiente Regional</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cálculo</h3>
            <p className="text-gray-600 mb-4">
              El coeficiente regional se calcula usando la fórmula:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
              coeficiente = clamp(floor + total_region_points * increment, floor, ceiling)
            </div>
            <p className="text-gray-600 mt-4">
              Donde <code className="bg-gray-100 px-1 rounded">total_region_points</code> es la suma de 
              puntos CE1 y CE2 de todos los equipos de la región para la temporada.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Parámetros por defecto</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Floor:</span>
                <span className="font-medium">0.8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ceiling:</span>
                <span className="font-medium">1.2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Increment:</span>
                <span className="font-medium">0.01</span>
              </div>
            </div>
            <p className="text-gray-600 mt-4 text-sm">
              Estos parámetros pueden ser ajustados por los administradores del sistema.
            </p>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="card text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Tienes preguntas?</h2>
        <p className="text-gray-600 mb-4">
          Si tienes alguna duda sobre el sistema de ranking o necesitas más información, 
          no dudes en contactar con FEDV.
        </p>
        <div className="flex justify-center space-x-4">
          <a
            href="mailto:info@fedv.es"
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            info@fedv.es
          </a>
          <span className="text-gray-400">|</span>
          <a
            href="https://fedv.es"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            fedv.es
          </a>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
