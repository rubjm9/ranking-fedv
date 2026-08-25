import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { getSeasonBreakdown } from '@/services/pointsBreakdownService'
import { formatPoints } from '@/utils/rankingCalculations'
import { cn } from '@/utils/cn'

const ANCHO = 320
const MARGEN = 8
/** Espacio necesario encima del disparador para no salirse por arriba. */
const UMBRAL_VOLTEO = 300
/** Margen para que el puntero pueda viajar del disparador al panel sin cerrarlo. */
const RETARDO_CIERRE = 180

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
  /** Equipo principal y, en el ranking de clubes, sus filiales. */
  teamIds: string[]
  teamName: string
  season: string
  modalities: string[]
  regionId?: string
  /** Valor que muestra la tabla, para contrastarlo con la suma. */
  value: number
  /** Nombre por id, para distinguir filiales dentro de un club. */
  memberNames?: Record<string, string>
  className?: string
}

/**
 * Muestra de dónde salen los puntos de una celda del ranking.
 *
 * Se pide el detalle solo al abrir y se cachea. Se abre con el ratón, con el
 * dedo y con el teclado: limitarlo a `hover` lo dejaría inservible en móvil.
 */
const PointsBreakdown: React.FC<PointsBreakdownProps> = ({
  teamIds,
  teamName,
  season,
  modalities,
  regionId,
  value,
  memberNames,
  className,
}) => {
  const id = useId()
  const [abierto, setAbierto] = useState(false)
  const botonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const cierreRef = useRef<number | undefined>(undefined)
  const [pos, setPos] = useState<{ top: number; left: number; debajo: boolean } | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['points-breakdown', teamIds.join(','), season, modalities.join(',')],
    queryFn: () => getSeasonBreakdown(teamIds, season, modalities, regionId),
    enabled: abierto,
    staleTime: 10 * 60 * 1000,
  })

  /*
   * El panel se pinta en un portal, así que al mover el ratón hacia él se sale
   * del disparador. Sin este retardo el panel desaparecía antes de poder
   * desplazarlo, y los últimos torneos quedaban inalcanzables.
   */
  const cancelarCierre = useCallback(() => {
    if (cierreRef.current) {
      window.clearTimeout(cierreRef.current)
      cierreRef.current = undefined
    }
  }, [])

  const cerrarConRetardo = useCallback(() => {
    cancelarCierre()
    cierreRef.current = window.setTimeout(() => setAbierto(false), RETARDO_CIERRE)
  }, [cancelarCierre])

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
    window.addEventListener('resize', recolocar)
    return () => window.removeEventListener('resize', recolocar)
  }, [abierto, recolocar])

  useEffect(() => {
    if (!abierto) return
    const alPulsar = (e: PointerEvent) => {
      const t = e.target as Node
      if (!botonRef.current?.contains(t) && !panelRef.current?.contains(t)) setAbierto(false)
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

  useEffect(() => cancelarCierre, [cancelarCierre])

  const descuadre = data ? Math.abs(data.total - value) > 0.01 : false
  const variosEquipos = teamIds.length > 1

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        aria-expanded={abierto}
        aria-controls={abierto ? id : undefined}
        aria-label={`Desglose de ${formatPoints(value)} puntos de ${teamName}`}
        onClick={() => (abierto ? setAbierto(false) : setAbierto(true))}
        onMouseEnter={() => {
          cancelarCierre()
          setAbierto(true)
        }}
        onMouseLeave={cerrarConRetardo}
        onFocus={() => setAbierto(true)}
        onBlur={cerrarConRetardo}
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
            ref={panelRef}
            id={id}
            role="dialog"
            aria-label={`Desglose de puntos de ${teamName}`}
            onMouseEnter={cancelarCierre}
            onMouseLeave={cerrarConRetardo}
            className="fixed z-[9999] w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-line bg-surface text-left shadow-xl"
            style={{
              top: pos.top,
              left: pos.left,
              transform: pos.debajo
                ? 'translate(-50%, 8px)'
                : 'translate(-50%, calc(-100% - 8px))',
            }}
          >
            <div className="flex items-baseline justify-between gap-2 border-b border-line px-3 py-2">
              <p className="truncate text-sm font-semibold text-content">{teamName}</p>
              <p className="shrink-0 text-xs text-content-muted">{season.replace('-', '/')}</p>
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
                  {data.entries.map((e, i) => (
                    <li key={`${e.tournamentId}-${e.teamId}-${i}`} className="px-3 py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {/* Formato del torneo: lo identifica sin repetir el nombre largo. */}
                          <p className="truncate text-sm font-semibold text-content">
                            {ETIQUETA_TIPO[e.type] ?? e.type}
                            {ETIQUETA_MODALIDAD[e.modality] && (
                              <span className="font-normal text-content-muted">
                                {' · '}
                                {ETIQUETA_MODALIDAD[e.modality]}
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 font-display text-base font-bold leading-tight text-brand-strong">
                            {e.position}.º puesto
                          </p>
                          {variosEquipos && memberNames?.[e.teamId] && (
                            <p className="mt-0.5 truncate text-xs text-content-subtle">
                              {memberNames[e.teamId]}
                            </p>
                          )}
                          {e.regionalCoefficient !== 1 && (
                            <p className="mt-0.5 text-xs tabular-nums text-content-subtle">
                              {formatPoints(e.basePoints)} × {e.regionalCoefficient.toFixed(2)} coef.
                              regional
                            </p>
                          )}
                        </div>
                        <p className="shrink-0 font-display text-base font-bold tabular-nums text-content">
                          {formatPoints(e.points)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {data && data.entries.length > 0 && (
              <div className="flex items-center justify-between gap-2 border-t border-line bg-surface-muted px-3 py-2">
                <span className="text-xs font-medium uppercase tracking-wide text-content-muted">
                  Total {season.replace('-', '/')}
                </span>
                <span className="font-display text-base font-bold tabular-nums text-content">
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
