import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Calculator, MapPin, Award, ChevronDown } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import PointsCurveTable from '@/components/about/PointsCurveTable'
import { nationalCurvePoints, regionalCurvePoints } from '@/utils/tournamentUtils'
import { DEFAULT_TEMPORAL_WEIGHTS } from '@/utils/rankingCalculations'

const AboutPage: React.FC = () => {
  const ce2Offset = 16
  const [pointsTablesExpanded, setPointsTablesExpanded] = useState(false)

  return (
    <PageContainer>
      <PageHeader
        title="Cómo funciona el ranking FEDV"
        subtitle="Una guía sencilla para entender cómo se puntúan los torneos, cómo se suman los resultados y cómo se construye el ranking oficial."
        className="text-center [&_.page-header-title]:text-center [&_.page-header-subtitle]:mx-auto"
      />

      <div className="space-y-8">
        {/* Escala de puntos */}
        <div className="card">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Escala de puntos</h2>

          <p className="text-slate-600 mb-4">
            Cada vez que un equipo participa en un torneo oficial, suma puntos según el puesto que
            consigue. Cuanto más arriba quede, más puntos recibe. A partir del 8º puesto, la bajada
            de puntos es un poco más suave que entre los primeros puestos, pero la idea es siempre
            la misma: premiar las mejores clasificaciones.
          </p>
          <p className="text-slate-600 mb-6">
            Los campeonatos de España reparten más puntos que los regionales, pero en ambos casos se
            sigue la misma lógica: el campeón parte de una cifra base y el resto de puestos van
            bajando de forma progresiva.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <PointsCurveTable
              title="Campeonatos de España"
              description="En 1ª división, el campeón recibe 1000 puntos. El 2º, el 3º y el resto de puestos reciben menos según la tabla."
              getPoints={nationalCurvePoints}
              expanded={pointsTablesExpanded}
            />

            <PointsCurveTable
              title="Campeonatos regionales"
              description={
                <>
                  En un regional, el campeón parte de 100 puntos base. Esos puntos se multiplican
                  después por el coeficiente regional de la región del equipo. Puedes leer cómo
                  funciona{' '}
                  <a
                    href="#coeficiente-regional"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    aquí
                  </a>
                  .
                </>
              }
              getPoints={regionalCurvePoints}
              expanded={pointsTablesExpanded}
              maxExpandedPositions={20}
            />
          </div>

          <div className="flex justify-center mb-6">
            <button
              type="button"
              onClick={() => setPointsTablesExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              aria-expanded={pointsTablesExpanded}
            >
              {pointsTablesExpanded ? 'Ver menos' : 'Ver tabla completa'}
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${pointsTablesExpanded ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
          </div>

          <div className="bg-secondary-50 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">¿Y la 2ª división?</h3>
            <p className="text-slate-600 text-sm">
              La 2ª división no tiene una tabla aparte. Sigue la misma escala que la 1ª división,
              como si fuera la continuación natural: cuando termina la 1ª, empiezan los puestos de
              la 2ª. Si en una categoría hay 16 equipos en 1ª división, el campeón de 2ª división
              recibe los puntos del puesto 17 de la escala nacional.
            </p>
            <p className="text-slate-600 text-sm mt-3">
              Ejemplo: con {ce2Offset} equipos en 1ª división, el campeón de 2ª división recibe{' '}
              {nationalCurvePoints(ce2Offset + 1)} puntos, los mismos que tendría un{' '}
              {ce2Offset + 1}º puesto en la tabla nacional.
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
        <div className="card scroll-mt-24" id="coeficiente-regional">
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
