import React, { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { nationalCurvePoints, regionalCurvePoints } from '@/utils/tournamentUtils'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/utils/cn'
import { useChartTheme } from '@/utils/chartTheme'

const baseNodeClass =
  'rounded-xl border border-line bg-surface/92 p-3 shadow-[0_18px_45px_-28px_rgba(30,64,175,0.45)] backdrop-blur-sm'

const modalityColumns = [
  { id: 'beach_mixed', label: 'Playa mixto', tone: 'primary' },
  { id: 'beach_open', label: 'Playa open', tone: 'slate' },
  { id: 'beach_women', label: 'Playa women', tone: 'slate' },
  { id: 'grass_mixed', label: 'Césped mixto', tone: 'emerald' },
  { id: 'grass_open', label: 'Césped open', tone: 'primary' },
  { id: 'grass_women', label: 'Césped women', tone: 'emerald' },
] as const

type ModalityColumnId = (typeof modalityColumns)[number]['id']

type SeasonEvent = {
  id: string
  columnId: ModalityColumnId
  chip: string
  detail: string
  points: number
}

const seasonEvents: SeasonEvent[] = [
  {
    id: 'ce1-beach-mixed',
    columnId: 'beach_mixed',
    chip: 'CE1 · 2.º',
    detail: 'Playa mixto',
    points: nationalCurvePoints(2),
  },
  {
    id: 'regional-beach-mixed',
    columnId: 'beach_mixed',
    chip: 'Regional · 1.º',
    detail: 'Playa mixto',
    points: regionalCurvePoints(1),
  },
  {
    id: 'ce2-grass-open',
    columnId: 'grass_open',
    chip: 'CE2 · 1.º',
    detail: 'Césped open',
    points: nationalCurvePoints(1),
  },
  {
    id: 'regional-grass-open',
    columnId: 'grass_open',
    chip: 'Regional · 3.º',
    detail: 'Césped open',
    points: regionalCurvePoints(3),
  },
  {
    id: 'ce1-beach-women',
    columnId: 'beach_women',
    chip: 'CE1 · 8.º',
    detail: 'Playa women',
    points: nationalCurvePoints(8),
  },
  {
    id: 'regional-grass-mixed',
    columnId: 'grass_mixed',
    chip: 'Regional · 2.º',
    detail: 'Césped mixto',
    points: regionalCurvePoints(2),
  },
  {
    id: 'ce2-beach-open',
    columnId: 'beach_open',
    chip: 'CE2 · 5.º',
    detail: 'Playa open',
    points: nationalCurvePoints(5),
  },
  {
    id: 'regional-beach-open',
    columnId: 'beach_open',
    chip: 'Regional · 1.º',
    detail: 'Playa open',
    points: regionalCurvePoints(1),
  },
]

const emptyTotals = (): Record<ModalityColumnId, number> =>
  Object.fromEntries(modalityColumns.map((column) => [column.id, 0])) as Record<
    ModalityColumnId,
    number
  >

const emptyStamps = (): Record<ModalityColumnId, SeasonEvent[]> =>
  Object.fromEntries(
    modalityColumns.map((column) => [column.id, [] as SeasonEvent[]])
  ) as Record<ModalityColumnId, SeasonEvent[]>

const FINAL_SEASON_STATE = (() => {
  const totals = emptyTotals()
  const stamps = emptyStamps()
  seasonEvents.forEach((event) => {
    totals[event.columnId] += event.points
    stamps[event.columnId] = [...stamps[event.columnId], event]
  })
  return { totals, stamps }
})()

const CURVE_MAX_POSITION = 20

const curveChartData = Array.from({ length: CURVE_MAX_POSITION }, (_, index) => {
  const position = index + 1
  return {
    position,
    ce: nationalCurvePoints(position),
    regional: regionalCurvePoints(position),
  }
})

const SceneFrame: React.FC<{
  title: string
  description: string
  children: React.ReactNode
  className?: string
}> = ({ title, description, children, className = '' }) => (
  <div
    className={`relative overflow-hidden rounded-[1.75rem] border border-line bg-gradient-to-br from-surface via-surface-muted to-brand-subtle/40 p-5 shadow-[0_25px_80px_-45px_rgba(15,23,42,0.35)] ${className}`}
  >
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_42%),linear-gradient(rgba(148,163,184,0.14)_1px,_transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.14)_1px,_transparent_1px)] bg-[size:auto,24px_24px,24px_24px] dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_42%),linear-gradient(rgba(51,65,85,0.45)_1px,_transparent_1px),linear-gradient(90deg,rgba(51,65,85,0.45)_1px,_transparent_1px)]" />
    <div className="relative">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h4 className="text-lg font-semibold text-content">{title}</h4>
        <p className="max-w-xl text-sm leading-6 text-content-muted">{description}</p>
      </div>
      {children}
    </div>
  </div>
)

const toneClasses: Record<string, string> = {
  slate: 'bg-surface-muted text-content-muted ring-line',
  primary: 'bg-brand-subtle text-brand-strong ring-brand-strong/30',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800',
}

type SeasonPhase = 'idle' | 'incoming' | 'committed' | 'hold'

export const TournamentFlowScene: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [totals, setTotals] = useState(emptyTotals)
  const [stamps, setStamps] = useState(emptyStamps)
  const [eventIndex, setEventIndex] = useState(0)
  const [phase, setPhase] = useState<SeasonPhase>('idle')
  const [bumpColumn, setBumpColumn] = useState<ModalityColumnId | null>(null)

  useEffect(() => {
    if (prefersReducedMotion) {
      setTotals(FINAL_SEASON_STATE.totals)
      setStamps(FINAL_SEASON_STATE.stamps)
      setPhase('hold')
      setEventIndex(seasonEvents.length - 1)
      return
    }

    let cancelled = false
    const timeoutIds: number[] = []

    const schedule = (delay: number, action: () => void) => {
      const timeoutId = window.setTimeout(() => {
        if (!cancelled) action()
      }, delay)
      timeoutIds.push(timeoutId)
    }

    const resetCycle = () => {
      setTotals(emptyTotals())
      setStamps(emptyStamps())
      setBumpColumn(null)
      setEventIndex(0)
      setPhase('idle')
      schedule(800, () => runEvent(0))
    }

    const runEvent = (index: number) => {
      const event = seasonEvents[index]
      if (!event) {
        setPhase('hold')
        schedule(1400, resetCycle)
        return
      }

      setEventIndex(index)
      setPhase('incoming')
      schedule(900, () => {
        setTotals((prev) => ({
          ...prev,
          [event.columnId]: prev[event.columnId] + event.points,
        }))
        setStamps((prev) => ({
          ...prev,
          [event.columnId]: [...prev[event.columnId], event],
        }))
        setBumpColumn(event.columnId)
        setPhase('committed')
        schedule(1000, () => {
          setBumpColumn(null)
          runEvent(index + 1)
        })
      })
    }

    schedule(600, () => runEvent(0))

    return () => {
      cancelled = true
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [prefersReducedMotion])

  const activeEvent = seasonEvents[eventIndex]
  const caption =
    phase === 'hold'
      ? 'Misma modalidad = mismo acumulado. Las otras no se mueven.'
      : phase === 'incoming' && activeEvent
        ? `${activeEvent.chip} entra en ${activeEvent.detail}`
        : phase === 'committed' && activeEvent
          ? `+${activeEvent.points} pts solo en ${activeEvent.detail}`
          : 'Cada modalidad lleva su propio acumulado de temporada'

  return (
    <SceneFrame
      title="Cada modalidad acumula su propia temporada"
      description="Un resultado suma solo en su columna. Dos campeonatos de playa mixto se apilan juntos; un CE de césped open abre otro ranking."
    >
      <div
        className="relative overflow-hidden rounded-[1.5rem] border border-line bg-surface-muted/60 p-4"
        role="img"
        aria-label="Acumulado animado donde cada campeonato suma puntos solo en la modalidad correspondiente"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center rounded-full border border-brand-strong/30 bg-brand-subtle px-3 py-1 text-xs font-semibold text-brand-strong">
            Temporada 24/25
          </span>
          <p className="text-sm font-medium text-content-muted">{caption}</p>
        </div>

        <div className="relative mb-4 flex min-h-[3.25rem] items-center justify-center">
          {!prefersReducedMotion && phase === 'incoming' && activeEvent && (
            <div
              key={`${activeEvent.id}-${eventIndex}`}
              className="onboarding-ledger-chip absolute inline-flex items-center gap-2 rounded-full border border-brand-strong/30 bg-surface px-4 py-2 text-sm font-semibold text-content shadow-sm"
            >
              <span className="rounded-full bg-primary-600 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                {activeEvent.chip.split(' · ')[0]}
              </span>
              <span>
                {activeEvent.chip.split(' · ')[1]} · {activeEvent.detail}
              </span>
              <span className="text-brand-strong">+{activeEvent.points}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {modalityColumns.map((column) => {
            const columnStamps = stamps[column.id]
            const isActive =
              !prefersReducedMotion &&
              activeEvent?.columnId === column.id &&
              (phase === 'incoming' || phase === 'committed')
            const isBumping = bumpColumn === column.id

            return (
              <div
                key={column.id}
                className={cn(
                  baseNodeClass,
                  'flex min-h-[10.5rem] flex-col transition-all duration-300',
                  isActive && 'border-primary-300 ring-2 ring-primary-100 dark:border-primary-400 dark:ring-primary-900',
                  isBumping && 'onboarding-ledger-bump'
                )}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold leading-5 text-content">{column.label}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-content-subtle">
                      Acumulado
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClasses[column.tone]}`}
                  >
                    {totals[column.id]}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-1">
                  {columnStamps.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-line bg-surface-muted/70 px-2 py-3 text-center text-[11px] text-content-subtle">
                      Sin resultados
                    </div>
                  ) : (
                    columnStamps.map((stamp) => (
                      <div
                        key={stamp.id}
                        className="rounded-lg border border-line bg-surface px-2 py-1.5 text-[11px] leading-4 text-content-muted"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-content">{stamp.chip}</span>
                          <span className="font-semibold text-brand-strong">+{stamp.points}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className={cn(baseNodeClass, 'bg-brand-subtle/80')}>
            <p className="text-sm font-semibold text-content">Acumulación</p>
            <p className="mt-2 text-sm text-content-muted">
              Un CE (CE1 o CE2) y los regionales de la misma modalidad se suman en la misma
              columna.
            </p>
          </div>
          <div className={cn(baseNodeClass, 'bg-surface-muted/80')}>
            <p className="text-sm font-semibold text-content">Independencia</p>
            <p className="mt-2 text-sm text-content-muted">
              Un resultado de césped open no mueve playa mixto ni ninguna otra modalidad.
            </p>
          </div>
          <div className={cn(baseNodeClass, 'bg-emerald-50/80 dark:bg-emerald-950/40')}>
            <p className="text-sm font-semibold text-content">Temporada completa</p>
            <p className="mt-2 text-sm text-content-muted">
              El ranking de modalidad es la suma de todos los campeonatos oficiales del año.
            </p>
          </div>
        </div>
      </div>
    </SceneFrame>
  )
}

type CurveTooltipProps = {
  active?: boolean
  payload?: Array<{ dataKey?: string | number; value?: number }>
  label?: string | number
}

const CurveTooltip: React.FC<CurveTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null

  const ce = payload.find((entry) => entry.dataKey === 'ce')?.value
  const regional = payload.find((entry) => entry.dataKey === 'regional')?.value

  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-content">Puesto n.º {label}</p>
      <p className="mt-1 text-content-muted">
        CE: <span className="font-semibold text-brand-strong">{ce ?? '—'} pts</span>
      </p>
      <p className="text-content-muted">
        Regional: <span className="font-semibold text-emerald-700 dark:text-emerald-300">{regional ?? '—'} pts</span>
      </p>
    </div>
  )
}

export const PositionCurveScene: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion()
  // Antes eran ternarios sobre hexadecimales sueltos, el único gráfico que
  // miraba el tema. Ahora sale de la misma fuente que el resto.
  const chart = useChartTheme()
  const { axis, axisLine, grid } = chart
  const reference = chart.axisLine

  return (
    <SceneFrame
      title="La curva premia mucho más los primeros puestos"
      description="La bajada es más agresiva del 1.º al 8.º puesto y luego se comprime. Compara la curva nacional con la base regional previa al coeficiente."
    >
      <div
        className="overflow-hidden rounded-[1.5rem] border border-line bg-surface/80 p-4"
        role="img"
        aria-label="Gráfica interactiva de puntos por puesto para Campeonatos de España y regionales"
      >
        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-medium text-content-subtle">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary-600" aria-hidden />
            Campeonatos de España
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            Regionales (base)
          </span>
          <span className="text-content-subtle">Toca o pasa el cursor para ver el detalle</span>
        </div>

        <div className="h-[260px] w-full sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curveChartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis
                type="number"
                dataKey="position"
                domain={[1, CURVE_MAX_POSITION]}
                ticks={[1, 4, 8, 12, 16, 20]}
                tick={{ fontSize: 11, fill: axis }}
                tickLine={false}
                axisLine={{ stroke: axisLine }}
                label={{
                  value: 'Puesto',
                  position: 'insideBottom',
                  offset: -2,
                  style: { fill: axis, fontSize: 12 },
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: axis }}
                tickLine={false}
                axisLine={{ stroke: axisLine }}
                width={42}
              />
              <Tooltip content={<CurveTooltip />} />
              <Legend
                verticalAlign="top"
                height={28}
                formatter={(value) => (
                  /* Sin esto la etiqueta hereda el color de la serie, que sobre
                     fondo oscuro bajaba a 3,35:1. */
                  <span className="text-content-muted">
                    {value === 'ce' ? 'Campeonatos de España' : 'Regionales'}
                  </span>
                )}
              />
              <ReferenceLine
                x={8.5}
                stroke={reference}
                strokeDasharray="4 4"
                label={{
                  value: 'Cambio 8.º→9.º',
                  position: 'insideTopRight',
                  fill: axis,
                  fontSize: 11,
                }}
              />
              <Line
                type="monotone"
                dataKey="ce"
                name="ce"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#1d4ed8' }}
                isAnimationActive={!prefersReducedMotion}
              />
              <Line
                type="monotone"
                dataKey="regional"
                name="regional"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#059669' }}
                isAnimationActive={!prefersReducedMotion}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className={cn(baseNodeClass, 'bg-brand-subtle/80')}>
            <p className="text-xs font-semibold tracking-[0.08em] text-brand-strong">1.º a 8.º</p>
            <p className="mt-2 text-sm text-content-muted">
              Caída del 15% por posición: ganar cambia mucho la foto.
            </p>
          </div>
          <div className={cn(baseNodeClass, 'bg-surface-muted/80')}>
            <p className="text-xs font-semibold tracking-[0.08em] text-content-muted">
              9.º en adelante
            </p>
            <p className="mt-2 text-sm text-content-muted">
              Caída del 10%: sigue premiando, pero comprime la zona baja.
            </p>
          </div>
          <div className={cn(baseNodeClass, 'bg-amber-50/80 dark:bg-amber-950/40')}>
            <p className="text-xs font-semibold tracking-[0.08em] text-amber-700 dark:text-amber-300">Regionales</p>
            <p className="mt-2 text-sm text-content-muted">
              La curva regional parte de 100 puntos y después se multiplica por coeficiente.
            </p>
          </div>
        </div>
      </div>
    </SceneFrame>
  )
}
