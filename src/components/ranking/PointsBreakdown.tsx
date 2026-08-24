import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { getSeasonBreakdown } from '@/services/pointsBreakdownService'
import { formatPoints } from '@/utils/rankingCalculations'
import { cn } from '@/utils/cn'

const ANCHO = 320
const MARGEN = 8
/** Espacio necesario encima del disparador para no salirse por arriba. */
const UMBRAL_VOLTEO = 260

const ETIQUETA_TIPO: Record<string, string> = {
  CE1: 'CE 1ª',
  CE2: 'CE 2ª',
  REGIONAL: 'Regional',
  INTERNATIONAL: 'Internacional',
}

const ETIQUETA_MODALIDAD: Record<string, string> = {
  beach_mixed: 'Playa mixto',
  beach_open: 'Playa open',
  beach_women: 'Playa women',
  grass_mixed: 'Césped mixto',
  grass_open: 'Césped open',
  grass_women: 'Césped women',
}

interface PointsBreakdownProps {
  teamId: string
  teamName: string
  season: string
  /** Modalidades que suma esta celda. */
  modalities: string[]
  regionId?: string
  /** Valor que muestra la tabla, para poder contrastarlo con la suma. */
  value: number
  className?: string
}

/**
 * Muestra de dónde salen los puntos de una celda del ranking.
 *
 * Se pide el detalle solo al abrir, y react-query lo cachea por equipo,
 * temporada y modalidades. Se abre con el ratón, con el dedo y con el teclado:
 * limitarlo a `hover` lo dejaría inservible en móvil, que es de donde viene la
 * mayoría del tráfico.
 */
const PointsBreakdown: React.FC<PointsBreakdownProps> = ({
  teamId,
  teamName,
  season,
  modalities,
  regionId,
  value,
  className,
}) => {
  const id = useId()
  const [abierto, setAbierto] = useState(false)
  const botonRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; debajo: boolean } | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['points-breakdown', teamId, season, modalities.join(',')],
    queryFn: () => getSeasonBreakdown(teamId, season, modalities, regionId),
    enabled: abierto,
    staleTime: 10 * 60 * 1000,
  })

  const recolocar = useCallback(() => {
    const el = botonRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const mitad = Math.min(ANCHO, window.innerWidth - MARGEN * 2) / 2
    const centro = r.left + r.width / 2
    setPos({
      top: r.top < UMBRAL_VOLTEO ? r.bottom : r.top,
      left: Math.min(Math.max(centro, MARGEN + mitad), window.innerWidth - MARGEN - mitad),
      debajo: r.top < UMBRAL_VOLTEO,
    })
  }, [])

  useLayoutEffect(() => {
    if (!abierto) {
      setPos(null)
      return
    }
    recolocar()
    window.addEventListener('scroll', recolocar, true)
    window.addEventListener('resize', recolocar)
    return () => {
      window.removeEventListener('scroll', recolocar, true)
      window.removeEventListener('resize', recolocar)
    }
  }, [abierto, recolocar])

  useEffect(() => {
    if (!abierto) return
    const alPulsar = (e: PointerEvent) => {
      if (!botonRef.current?.contains(e.target as Node)) setAbierto(false)
    }
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false)
        botonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', alPulsar)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('pointerdown', alPulsar)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [abierto])

  const descuadre = data ? Math.abs(data.total - value) > 0.01 : false

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        aria-expanded={abierto}
        aria-controls={abierto ? id : undefined}
        aria-label={`Desglose de ${formatPoints(value)} puntos de ${teamName}`}
        onClick={() => setAbierto((v) => !v)}
        onMouseEnter={() => setAbierto(true)}
        onMouseLeave={() => setAbierto(false)}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        className={cn(
          'inline-flex min-h-[44px] items-center justify-end rounded touch-manipulation tabular-nums underline decoration-dotted decoration-content-subtle underline-offset-4 transition-colors hover:text-link focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          className
        )}
      >
        {formatPoints(value)}
      </button>

      {abierto &&
        pos &&
        createPortal(
          <div
            id={id}
            role="dialog"
            aria-label={`Desglose de puntos de ${teamName}`}
            className="fixed z-[9999] w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-line bg-surface text-left shadow-xl"
            style={{
              top: pos.top,
              left: pos.left,
              transform: pos.debajo
                ? 'translate(-50%, 8px)'
                : 'translate(-50%, calc(-100% - 8px))',
            }}
          >
            <div className="border-b border-line px-3 py-2">
              <p className="truncate text-sm font-semibold text-content">{teamName}</p>
              <p className="text-xs text-content-muted">Temporada {season.replace('-', '/')}</p>
            </div>

            <div className="max-h-64 overflow-y-auto overscroll-contain">
              {isLoading && (
                <p className="px-3 py-4 text-sm text-content-muted" role="status">
                  Cargando desglose…
                </p>
              )}

              {isError && (
                <p className="px-3 py-4 text-sm text-content-muted">
                  No se pudo cargar el desglose.
                </p>
              )}

              {data && data.entries.length === 0 && (
                <p className="px-3 py-4 text-sm text-content-muted">
                  Sin torneos puntuables en esta temporada.
                </p>
              )}

              {data && data.entries.length > 0 && (
                <ul className="divide-y divide-line">
                  {data.entries.map((e) => (
                    <li key={e.tournamentId} className="px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-content">{e.tournamentName}</p>
                          <p className="text-xs text-content-muted">
                            <span className="font-medium">
                              {ETIQUETA_TIPO[e.type] ?? e.type}
                            </span>
                            {modalities.length > 1 && ETIQUETA_MODALIDAD[e.modality] && (
                              <> · {ETIQUETA_MODALIDAD[e.modality]}</>
                            )}
                            {' · '}
                            {e.position}.º puesto
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-content">
                          {formatPoints(e.points)}
                        </p>
                      </div>
                      {e.regionalCoefficient !== 1 && (
                        <p className="mt-0.5 text-xs text-content-subtle tabular-nums">
                          {formatPoints(e.basePoints)} × {e.regionalCoefficient.toFixed(2)} (coef.
                          regional)
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {data && data.entries.length > 0 && (
              <div className="flex items-center justify-between gap-2 border-t border-line bg-surface-muted px-3 py-2">
                <span className="text-xs font-medium uppercase tracking-wide text-content-muted">
                  Total
                </span>
                <span className="text-sm font-bold tabular-nums text-content">
                  {formatPoints(data.total)}
                </span>
              </div>
            )}

            {descuadre && (
              <p className="border-t border-line px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                El desglose no cuadra con el total de la tabla ({formatPoints(value)}). Puede que la
                caché de puntos esté desactualizada.
              </p>
            )}
          </div>,
          document.body
        )}
    </>
  )
}

export default PointsBreakdown
