import React, { useState } from 'react'
import { Info, BarChart3, Target, TrendingUp } from 'lucide-react'
import PointsCurveTable from '@/components/about/PointsCurveTable'
import {
  nationalCurvePoints,
  regionalCurvePoints,
  getPointsForPosition,
  DEFAULT_DIVISION_SIZE,
} from '@/utils/tournamentUtils'
import {
  DEFAULT_TEMPORAL_WEIGHTS,
  DEFAULT_REGIONAL_CONFIG,
} from '@/utils/rankingCalculations'

const TEMPORAL_WEIGHT_ROWS = [
  { label: 'Año actual', value: DEFAULT_TEMPORAL_WEIGHTS.current },
  { label: '1 año atrás', value: DEFAULT_TEMPORAL_WEIGHTS.previous },
  { label: '2 años atrás', value: DEFAULT_TEMPORAL_WEIGHTS.twoAgo },
  { label: '3 años atrás', value: DEFAULT_TEMPORAL_WEIGHTS.threeAgo },
]

const ConfigurationPage: React.FC = () => {
  const [pointsExpanded, setPointsExpanded] = useState(false)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configuración del sistema</h1>
        <p className="text-gray-600 mt-1">
          Referencia de los parámetros activos del motor de ranking
        </p>
      </div>

      <div className="mb-8 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Solo lectura</p>
          <p className="mt-1 text-amber-800">
            Los valores mostrados se calculan en tiempo real desde{' '}
            <code className="text-xs bg-amber-100 px-1 rounded">tournamentUtils.ts</code> y{' '}
            <code className="text-xs bg-amber-100 px-1 rounded">rankingCalculations.ts</code>.
            Editar aquí no tendría efecto: haría falta cambiar el código y ejecutar el
            recálculo de puntos y rankings desde{' '}
            <span className="font-medium">Actualizar rankings</span>.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Tablas de puntos
            </h2>
            <button
              type="button"
              onClick={() => setPointsExpanded((v) => !v)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {pointsExpanded ? 'Ver resumen' : 'Ver tabla completa'}
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Curva unificada: decaimiento 85% en puestos 1–8, 90% desde el 9. Nacional ancla 1000 pts,
            regional ancla 100 pts. CE2 continúa la curva nacional con offset de{' '}
            {DEFAULT_DIVISION_SIZE} (tamaño estándar de 1ª división).
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PointsCurveTable
              title="Campeonato España 1ª"
              description="Puntos base por puesto en competiciones nacionales de 1ª división."
              getPoints={nationalCurvePoints}
              expanded={pointsExpanded}
            />
            <PointsCurveTable
              title="Campeonato España 2ª"
              description={
                <>
                  Continúa la curva de 1ª desde el puesto {DEFAULT_DIVISION_SIZE + 1}. Con división
                  estándar de {DEFAULT_DIVISION_SIZE}, el campeón de 2ª recibe{' '}
                  {getPointsForPosition(1, 'CE2', DEFAULT_DIVISION_SIZE)} pts.
                </>
              }
              getPoints={(pos) => getPointsForPosition(pos, 'CE2', DEFAULT_DIVISION_SIZE)}
              expanded={pointsExpanded}
            />
            <PointsCurveTable
              title="Campeonatos regionales"
              description="Puntos base antes de aplicar el coeficiente regional de cada comunidad."
              getPoints={regionalCurvePoints}
              expanded={pointsExpanded}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Pesos temporales
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Multiplicadores aplicados al calcular coeficientes regionales según la antigüedad
              de los resultados (ventana de 4 temporadas).
            </p>
            <div className="grid grid-cols-2 gap-4">
              {TEMPORAL_WEIGHT_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <p className="text-sm text-gray-600">{row.label}</p>
                  <p className="text-lg font-semibold text-gray-900 font-mono">×{row.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Coeficiente regional
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Límites de la fórmula que calcula el coeficiente por región y modalidad. Los
              valores resultantes se almacenan en la tabla{' '}
              <code className="text-xs bg-gray-100 px-1 rounded">regional_coefficients</code>.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-sm text-gray-600">Límite inferior</p>
                <p className="text-lg font-semibold text-gray-900 font-mono">
                  {DEFAULT_REGIONAL_CONFIG.floor}
                </p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-sm text-gray-600">Límite superior</p>
                <p className="text-lg font-semibold text-gray-900 font-mono">
                  {DEFAULT_REGIONAL_CONFIG.ceiling}
                </p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-sm text-gray-600">Incremento</p>
                <p className="text-lg font-semibold text-gray-900 font-mono">
                  {DEFAULT_REGIONAL_CONFIG.increment}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default ConfigurationPage
