import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Calculator, ChevronDown, Layers3, MapPin, Timer, Trophy } from 'lucide-react'
import PointsCurveTable from '@/components/about/PointsCurveTable'
import RankingOnboardingStep from '@/components/home/RankingOnboardingStep'
import {
  PositionCurveScene,
  TournamentFlowScene,
} from '@/components/home/RankingOnboardingVisuals'
import TemporalWeightChart from '@/components/home/TemporalWeightChart'
import RegionalCoeffExplainer from '@/components/home/RegionalCoeffExplainer'
import {
  DEFAULT_DIVISION_SIZE,
  nationalCurvePoints,
  regionalCurvePoints,
} from '@/utils/tournamentUtils'

const PREVIEW_POSITIONS = [1, 2, 3, 8, 9, 16]

const SURFACES = [
  {
    name: 'Playa',
    categories: ['Mixto', 'Open', 'Women'],
    dotColor: 'bg-primary-500',
    badgeColor: 'bg-primary-50 text-primary-700',
  },
  {
    name: 'Césped',
    categories: ['Mixto', 'Open', 'Women'],
    dotColor: 'bg-emerald-500',
    badgeColor: 'bg-emerald-50 text-emerald-700',
  },
]

const COMBINATIONS = [
  { title: 'Global', description: 'Suma de las 6 modalidades' },
  { title: 'Playa', description: 'Mixto + Open + Women en playa' },
  { title: 'Césped', description: 'Mixto + Open + Women en césped' },
  { title: 'Mixto', description: 'Playa mixto + césped mixto' },
  { title: 'Women', description: 'Playa women + césped women' },
  { title: 'Open', description: 'Playa open + césped open' },
]

const RankingOnboarding: React.FC = () => {
  const [pointsTablesExpanded, setPointsTablesExpanded] = useState(false)

  return (
    <section className="mb-8 rounded-[2rem] border border-slate-200 bg-gradient-to-b from-white to-secondary-50/70 px-4 py-10 shadow-sm sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <span className="mb-4 inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
          Onboarding del ranking
        </span>
        <h2 className="section-title mb-2">¿Cómo funciona el ranking?</h2>
        <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-600">
          Un recorrido rápido para entender cómo se reparten los puntos, cómo se ponderan
          las temporadas y cómo se construye el ranking final.
        </p>
      </div>

      <div className="relative">
        <div
          className="absolute bottom-3 left-[15px] top-3 hidden w-px bg-gradient-to-b from-primary-200 via-primary-300 to-primary-100 sm:block"
          aria-hidden
        />

        <div className="space-y-8">
          <RankingOnboardingStep step={1} title="Participación en torneos" icon={<Trophy className="h-5 w-5" />}>
            <p className="mb-5 text-lg text-slate-700">
              Los equipos suman puntos según su posición en torneos oficiales FEDV: Campeonatos de
              España (CE1 y CE2) y campeonatos regionales. Cada modalidad tiene su ranking
              independiente y los puntos de todos los torneos de la temporada se acumulan.
            </p>

            <div className="mb-6">
              <TournamentFlowScene />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {SURFACES.map((surface) => (
                <div key={surface.name} className="rounded-xl border border-slate-200 bg-white/80 p-4">
                  <h4 className="mb-3 text-lg font-semibold text-slate-900">{surface.name}</h4>
                  <div className="space-y-2">
                    {surface.categories.map((category) => (
                      <div key={category} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${surface.dotColor}`} aria-hidden />
                          <span className="text-slate-700">{category}</span>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${surface.badgeColor}`}>
                          {category.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-secondary-50 p-4 text-sm text-slate-700">
              <strong className="text-slate-900">6 modalidades independientes:</strong> playa mixto,
              playa open, playa women, césped mixto, césped open y césped women.
            </div>
          </RankingOnboardingStep>

          <RankingOnboardingStep step={2} title="Puntos por posición" icon={<Calculator className="h-5 w-5" />}>
            <p className="mb-4 text-lg text-slate-700">
              La escala usa una curva por tramos: desde el 1.º hasta el 8.º puesto los puntos caen
              un 15% por posición, y a partir del 9.º la caída se suaviza al 10%.
            </p>
            <p className="mb-5 text-sm text-slate-600">
              En nacionales la base del campeón es 1000 puntos. En regionales la base es 100, y luego
              se aplica el coeficiente regional.
            </p>

            <div className="mb-6">
              <PositionCurveScene />
            </div>

            <div className="mb-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              <PointsCurveTable
                title="Campeonatos de España"
                description="Puntos de la curva nacional, empezando en 1000 para el campeón."
                getPoints={nationalCurvePoints}
                expanded={pointsTablesExpanded}
                previewPositions={PREVIEW_POSITIONS}
                maxExpandedPositions={32}
              />
              <PointsCurveTable
                title="Campeonatos regionales"
                description="Puntos base de la curva regional, empezando en 100 para el campeón."
                getPoints={regionalCurvePoints}
                expanded={pointsTablesExpanded}
                previewPositions={PREVIEW_POSITIONS}
                maxExpandedPositions={32}
              />
            </div>

            <div className="mb-6 flex justify-center">
              <button
                type="button"
                onClick={() => setPointsTablesExpanded((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:border-primary-300 hover:text-primary-700"
                aria-expanded={pointsTablesExpanded}
              >
                {pointsTablesExpanded ? 'Ver menos' : 'Ver tabla completa'}
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${
                    pointsTablesExpanded ? 'rotate-180' : ''
                  }`}
                  aria-hidden
                />
              </button>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-secondary-50 p-4">
              <h4 className="text-lg font-semibold text-slate-900">¿Y la 2ª división?</h4>
              <p className="text-sm text-slate-700">
                La 2ª división continúa la curva nacional. Con {DEFAULT_DIVISION_SIZE} equipos en 1ª,
                el campeón de 2ª recibe los puntos del puesto {DEFAULT_DIVISION_SIZE + 1}:{' '}
                {nationalCurvePoints(DEFAULT_DIVISION_SIZE + 1)} puntos.
              </p>
              <p className="text-sm text-slate-700">
                En regionales, los puntos finales se calculan así:{' '}
                <strong>puntos finales = puntos base × coeficiente regional</strong>.
              </p>
            </div>
          </RankingOnboardingStep>

          <RankingOnboardingStep step={3} title="Peso temporal" icon={<Timer className="h-5 w-5" />}>
            <p className="mb-5 text-lg text-slate-700">
              El ranking actual prioriza el rendimiento reciente: cada temporada mantiene peso, pero
              disminuye según su antigüedad.
            </p>
            <TemporalWeightChart />
          </RankingOnboardingStep>

          <RankingOnboardingStep step={4} title="Coeficiente regional" icon={<MapPin className="h-5 w-5" />}>
            <RegionalCoeffExplainer />
          </RankingOnboardingStep>

          <RankingOnboardingStep step={5} title="Rankings combinados" icon={<Layers3 className="h-5 w-5" />}>
            <p className="mb-5 text-lg text-slate-700">
              A partir de las seis modalidades se construyen rankings agrupados por superficie,
              categoría y un ranking global de equipos.
            </p>

            <div className="mb-5 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {COMBINATIONS.map((combination) => (
                <div
                  key={combination.title}
                  className="border-b border-slate-200/80 pb-4 last:border-b-0 sm:border-b sm:pb-4"
                >
                  <p className="text-base font-semibold text-slate-900">{combination.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{combination.description}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-primary-100 bg-primary-50/80 px-4 py-3 text-sm leading-6 text-slate-700">
              Durante la temporada, el ranking global se actualiza por subtemporadas para reflejar qué
              modalidades ya se han disputado, sin esperar al cierre completo del año.
            </div>
          </RankingOnboardingStep>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link
          to="/como-funciona"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <Award className="h-4 w-4" />
          Ver guía completa del ranking
        </Link>
      </div>
    </section>
  )
}

export default RankingOnboarding
