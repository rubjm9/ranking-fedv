import React, { useEffect, useRef, useState } from 'react'
import { DEFAULT_TEMPORAL_WEIGHTS } from '@/utils/rankingCalculations'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

const RAW_POINTS = 1000

const SEASONS = [
  {
    label: 'Temporada actual',
    value: DEFAULT_TEMPORAL_WEIGHTS.current,
    chip: 'Peso completo (100%)',
    detail: 'Cuenta al completo: marca el estado real del equipo ahora.',
    tone: 'from-primary-700 to-primary-400',
  },
  {
    label: 'Temporada T - 1',
    value: DEFAULT_TEMPORAL_WEIGHTS.previous,
    chip: 'Sigue contando mucho (80%)',
    detail: 'Sigue aportando con fuerza, aunque ya no domina la foto final.',
    tone: 'from-primary-600 to-sky-400',
  },
  {
    label: 'Temporada T - 2',
    value: DEFAULT_TEMPORAL_WEIGHTS.twoAgo,
    chip: 'Contexto histórico (50%)',
    detail: 'Aporta contexto histórico sin arrastrar en exceso.',
    tone: 'from-slate-600 to-slate-400',
  },
  {
    label: 'Temporada T - 3',
    value: DEFAULT_TEMPORAL_WEIGHTS.threeAgo,
    chip: 'Sigue aportando (20%)',
    detail: 'No se borra: sigue aportando una quinta parte de sus puntos brutos.',
    tone: 'from-slate-500 to-slate-300',
  },
] as const

const TOTAL_WEIGHTED = SEASONS.reduce((sum, season) => sum + RAW_POINTS * season.value, 0)

const TemporalWeightChart: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const [filled, setFilled] = useState(prefersReducedMotion)

  useEffect(() => {
    if (prefersReducedMotion) {
      setFilled(true)
      return
    }

    const node = containerRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setFilled(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [prefersReducedMotion])

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-[1.5rem] border border-line bg-gradient-to-br from-surface via-surface-muted to-brand-subtle/40 p-4 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.45)]"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-lg font-semibold text-content">
            La temporada reciente pesa más
          </h4>
          <p className="mt-1 text-sm leading-6 text-content-muted">
            Si cada temporada aporta {RAW_POINTS} pts brutos: bruto × peso = aportación.
          </p>
        </div>
        <div className="rounded-xl border border-brand-strong/30 bg-brand-subtle px-3 py-2 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-strong">
            Total ponderado
          </p>
          <p className="text-xl font-semibold text-brand-strong">{TOTAL_WEIGHTED}</p>
        </div>
      </div>

      <div className="space-y-2">
        {SEASONS.map((season, index) => {
          const percentage = Math.round(season.value * 100)
          const contribution = Math.round(RAW_POINTS * season.value)
          const barWidth = filled ? percentage : 0

          return (
            <div
              key={season.label}
              className="rounded-xl border border-line bg-surface/90 px-3 py-2.5"
            >
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className="text-sm font-semibold text-content">{season.label}</p>
                  <p className="text-xs text-content-subtle">{season.chip}</p>
                </div>
                <p className="font-mono text-sm font-semibold text-content">
                  {RAW_POINTS} × {season.value.toFixed(1)} ={' '}
                  <span className="text-brand-strong">{contribution}</span>
                </p>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-line">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${season.tone} ${
                    prefersReducedMotion ? '' : 'transition-[width] duration-700 ease-out'
                  }`}
                  style={{
                    width: `${barWidth}%`,
                    transitionDelay: prefersReducedMotion ? undefined : `${index * 120}ms`,
                  }}
                />
              </div>

              <p className="mt-1.5 truncate text-xs text-content-subtle" title={season.detail}>
                {season.detail}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TemporalWeightChart
