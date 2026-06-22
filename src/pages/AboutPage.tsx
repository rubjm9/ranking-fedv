import React from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Calculator, MapPin, Award } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import { nationalCurvePoints, regionalCurvePoints } from '@/utils/tournamentUtils'
import { DEFAULT_TEMPORAL_WEIGHTS } from '@/utils/rankingCalculations'

const AboutPage: React.FC = () => {
  const ce2Offset = 16

  return (
    <PageContainer>
      <PageHeader
        title="Cómo funciona el ranking FEDV"
        subtitle="Metodología oficial del sistema de ranking de Ultimate Frisbee en España: escala de puntos, torneos nacionales y regionales, coeficiente regional y ponderación temporal."
        className="text-center [&_.page-header-title]:text-center [&_.page-header-subtitle]:mx-auto"
      />

      <div className="space-y-8">
        {/* Escala de puntos */}
        <div className="card">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Escala de puntos</h2>

          <p className="text-slate-600 mb-6">
            Todos los torneos comparten la misma forma de curva: decaimiento del <strong>85%</strong> entre
            los puestos 1 y 8, y del <strong>90%</strong> a partir del puesto 9. Solo cambia el ancla según el
            ámbito del torneo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border border-slate-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Curva nacional (ancla 1000)</h3>
              <p className="text-slate-600 text-sm mb-4">
                Aplica a CE1 y CE2. El campeón de 1ª división recibe 1000 puntos.
              </p>
              <div className="text-sm text-slate-500 space-y-1">
                <p>1º: {nationalCurvePoints(1)} pts</p>
                <p>2º: {nationalCurvePoints(2)} pts</p>
                <p>8º: {nationalCurvePoints(8)} pts</p>
                <p>9º: {nationalCurvePoints(9)} pts (inicio del tramo 90%)</p>
                <p>16º: {nationalCurvePoints(16)} pts</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Curva regional (ancla 100)</h3>
              <p className="text-slate-600 text-sm mb-4">
                Misma forma de decaimiento, escala 10 veces menor. Los puntos base se multiplican después
                por el coeficiente regional.
              </p>
              <div className="text-sm text-slate-500 space-y-1">
                <p>1º: {regionalCurvePoints(1)} pts</p>
                <p>2º: {regionalCurvePoints(2)} pts</p>
                <p>8º: {regionalCurvePoints(8)} pts</p>
                <p>9º: {regionalCurvePoints(9)} pts</p>
              </div>
            </div>
          </div>

          <div className="bg-secondary-50 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">CE2: continuación de la curva nacional</h3>
            <p className="text-slate-600 text-sm">
              El campeonato de 2ª división no tiene escala propia: continúa la curva nacional justo después
              del último equipo de su 1ª asociada. El desplazamiento (<code className="bg-slate-100 px-1 rounded">offset</code>)
              es el tamaño de esa 1ª división, almacenado en <code className="bg-slate-100 px-1 rounded">divisionSize</code>{' '}
              (por defecto 16). El torneo CE2 se vincula a su CE1 mediante{' '}
              <code className="bg-slate-100 px-1 rounded">parentTournamentId</code>.
            </p>
            <p className="text-slate-600 text-sm mt-3">
              Ejemplo con 1ª de {ce2Offset} equipos: el campeón de 2ª (puesto 1 en CE2) recibe los puntos
              del puesto {ce2Offset + 1} de la curva nacional ({nationalCurvePoints(ce2Offset + 1)} pts).
            </p>
          </div>
        </div>

        {/* Torneos nacionales vs regionales */}
        <div className="card">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Torneos nacionales y regionales</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <Award className="h-6 w-6 text-yellow-500 mr-2" />
                <h3 className="text-lg font-semibold text-slate-900">CE1 — 1ª división</h3>
              </div>
              <p className="text-slate-600 text-sm">
                Campeonato de España de primera división. Puntos directos de la curva nacional desde el puesto 1.
              </p>
            </div>

            <div className="border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <Award className="h-6 w-6 text-slate-500 mr-2" />
                <h3 className="text-lg font-semibold text-slate-900">CE2 — 2ª división</h3>
              </div>
              <p className="text-slate-600 text-sm">
                Campeonato de ascenso. Puntos de la curva nacional con offset según el tamaño de su 1ª asociada.
              </p>
            </div>

            <div className="border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <Award className="h-6 w-6 text-orange-500 mr-2" />
                <h3 className="text-lg font-semibold text-slate-900">Regional</h3>
              </div>
              <p className="text-slate-600 text-sm">
                Torneos autonómicos. Puntos base de la curva regional (ancla 100), multiplicados por el
                coeficiente de la región del equipo.
              </p>
              <div className="mt-4 bg-primary-50 rounded-lg p-3 font-mono text-sm text-primary-900 text-center">
                puntos finales = puntos base × coeficiente regional
              </div>
              <p className="text-slate-500 text-xs mt-2">
                Resultado redondeado a 2 decimales.
              </p>
            </div>
          </div>
        </div>

        {/* Coeficiente regional */}
        <div className="card">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Coeficiente regional</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Qué mide</h3>
              <p className="text-slate-600 mb-4">
                Refleja la fortaleza relativa de cada región en el ámbito nacional. Solo se usan resultados
                de torneos <strong>CE1 y CE2</strong>; los campeonatos regionales se excluyen del cálculo.
              </p>
              <p className="text-slate-600 mb-4">
                Se calcula al cierre de cada temporada, se almacena por temporada y modalidad, y se aplica
                a los torneos <strong>REGIONAL de la temporada siguiente</strong> (coeficientes de T−1 →
                regionales de T).
              </p>
              <Link to="/regiones" className="text-primary-600 hover:text-primary-500 font-medium text-sm">
                Ver coeficientes por región →
              </Link>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Fórmula</h3>
              <div className="bg-primary-50 rounded-xl p-4 font-mono text-sm text-primary-900 text-center mb-4">
                coef = clamp(1.0 + (pts_región − media) / media × 0.20, 0.80, 1.20)
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  <strong>Paso 1:</strong> Sumar puntos CE1/CE2 de los equipos de cada región en una ventana
                  de 4 temporadas, ponderados por antigüedad.
                </p>
                <p>
                  <strong>Paso 2:</strong> Calcular la media nacional (total ÷ número de regiones).
                </p>
                <p>
                  <strong>Paso 3:</strong> La desviación respecto a la media determina el coeficiente.
                  El factor 0.20 corresponde al rango ±20% (techo 1.2 − 1.0).
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Ventana temporal (4 temporadas)</h3>
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Temporada</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Peso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="px-4 py-2">Actual (T)</td>
                    <td className="px-4 py-2">×{DEFAULT_TEMPORAL_WEIGHTS.current}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">T − 1</td>
                    <td className="px-4 py-2">×{DEFAULT_TEMPORAL_WEIGHTS.previous}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">T − 2</td>
                    <td className="px-4 py-2">×{DEFAULT_TEMPORAL_WEIGHTS.twoAgo}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">T − 3</td>
                    <td className="px-4 py-2">×{DEFAULT_TEMPORAL_WEIGHTS.threeAgo}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Parámetros y modalidades</h3>
              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div className="flex justify-between">
                  <span>Mínimo (floor):</span>
                  <span className="font-medium">0.80</span>
                </div>
                <div className="flex justify-between">
                  <span>Máximo (ceiling):</span>
                  <span className="font-medium">1.20</span>
                </div>
                <div className="flex justify-between">
                  <span>Incremento de redondeo:</span>
                  <span className="font-medium">0.05</span>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Se calcula por separado para las <strong>6 modalidades</strong>: playa mixto, playa open,
                playa femenino, césped mixto, césped open y césped femenino.
              </p>
            </div>
          </div>
        </div>

        {/* Cómo se calcula el ranking */}
        <div className="card">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Cómo se calcula el ranking</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Puntos por torneo</h3>
              <p className="text-slate-600 text-sm">
                Cada resultado aporta puntos según posición, tipo de torneo y (en regionales) coeficiente
                de la región del equipo.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Ponderación temporal</h3>
              <p className="text-slate-600 text-sm">
                El ranking actual suma los puntos de las últimas 4 temporadas con pesos decrecientes:
                1.0, 0.8, 0.5 y 0.2.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Rankings por modalidad</h3>
              <p className="text-slate-600 text-sm">
                Cada combinación de superficie y categoría tiene su propio ranking independiente.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Temporada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Factor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Descripción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">Actual</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">×1.0</td>
                  <td className="px-6 py-4 text-sm text-slate-600">Peso completo</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">Anterior</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">×0.8</td>
                  <td className="px-6 py-4 text-sm text-slate-600">80% del peso</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">Hace 2 años</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">×0.5</td>
                  <td className="px-6 py-4 text-sm text-slate-600">50% del peso</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">Hace 3 años</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">×0.2</td>
                  <td className="px-6 py-4 text-sm text-slate-600">20% del peso</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Contacto */}
        <div className="card text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">¿Tienes preguntas?</h2>
          <p className="text-slate-600 mb-4">
            Si tienes alguna duda sobre el sistema de ranking o necesitas más información,
            contacta con FEDV.
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="mailto:info@fedv.es"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              info@fedv.es
            </a>
            <span className="text-slate-400">|</span>
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
    </PageContainer>
  )
}

export default AboutPage
