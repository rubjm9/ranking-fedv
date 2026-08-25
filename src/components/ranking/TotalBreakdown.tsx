import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatPoints } from '@/utils/rankingCalculations'
import { useHasHover } from '@/hooks/useHasHover'
import { cn } from '@/utils/cn'

const ANCHO = 300
const MARGEN = 8
const UMBRAL_VOLTEO = 260
const RETARDO_CIERRE = 180

interface TotalBreakdownProps {
  teamName: string
  seasons: string[]
  coefficients: number[]
  /** Puntos base del equipo en cada temporada. */
  getSeasonPoints: (season: string) => number
  total: number
  /** En el ranking histórico no se aplica ponderación temporal. */
  weighted?: boolean
  className?: string
}

/**
 * Explica el total del ranking: qué aportó cada temporada tras la ponderación.
 *
 * Es el paso que faltaba para cerrar la trazabilidad. El desglose por
 * temporada ya dice de qué torneos salen sus puntos; esto dice cómo esas
 * cuatro temporadas se combinan en la cifra final.
 */
const TotalBreakdown: React.FC<TotalBreakdownProps> = ({
  teamName,
  seasons,
  coefficients,
  getSeasonPoints,
  total,
  weighted = true,
  className,
}) => {
  const id = useId()
  const conHover = useHasHover()
  const [abierto, setAbierto] = useState(false)
  const botonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const cierreRef = useRef<number | undefined>(undefined)
  const [pos, setPos] = useState<{ top: number; left: number; debajo: boolean } | null>(null)

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

    /*
     * Al desplazar la página el panel debe seguir a su celda, pero el scroll
     * interno de la propia lista no debe recolocarlo: se ignora cuando el
     * evento nace dentro del panel.
     */
    const alDesplazar = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return
      recolocar()
    }
    window.addEventListener('scroll', alDesplazar, true)
    window.addEventListener('resize', recolocar)
    return () => {
      window.removeEventListener('scroll', alDesplazar, true)
      window.removeEventListener('resize', recolocar)
    }
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

  const filas = seasons.map((season, i) => {
    const base = getSeasonPoints(season) || 0
    const coef = weighted ? (coefficients[i] ?? 0) : 1
    return { season, base, coef, aporta: base * coef }
  })
  const suma = filas.reduce((s, f) => s + f.aporta, 0)
  const descuadre = Math.abs(suma - total) > 0.01

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        aria-expanded={abierto}
        aria-controls={abierto ? id : undefined}
        aria-label={`Cómo se calcula el total de ${formatPoints(total)} puntos de ${teamName}`}
        onClick={() => setAbierto((v) => !v)}
        onMouseEnter={
          conHover
            ? () => {
                cancelarCierre()
                setAbierto(true)
              }
            : undefined
        }
        onMouseLeave={conHover ? cerrarConRetardo : undefined}
        onFocus={() => setAbierto(true)}
        onBlur={(e) => {
          // Tocar dentro del panel quita el foco del botón: no debe cerrarlo.
          if (panelRef.current?.contains(e.relatedTarget as Node)) return
          cerrarConRetardo()
        }}
        className={cn(
          'inline-flex min-h-[44px] items-center justify-end rounded font-bold tabular-nums underline decoration-dotted decoration-content-subtle underline-offset-4 touch-manipulation transition-colors hover:text-link focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          className
        )}
      >
        {formatPoints(total)}
      </button>

      {abierto &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            id={id}
            role="dialog"
            aria-label={`Cálculo del total de ${teamName}`}
            onMouseEnter={conHover ? cancelarCierre : undefined}
            onMouseLeave={conHover ? cerrarConRetardo : undefined}
            className="fixed z-[9999] w-[300px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-line bg-surface text-left shadow-xl"
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
              <p className="text-xs text-content-muted">
                {weighted ? 'Ponderación por antigüedad' : 'Suma histórica'}
              </p>
            </div>

            <table className="w-full text-sm">
              <caption className="sr-only">
                Aportación de cada temporada al total del ranking
              </caption>
              <thead>
                <tr className="text-xs uppercase tracking-wide text-content-muted">
                  <th scope="col" className="px-3 py-1.5 text-left font-medium">
                    Temporada
                  </th>
                  <th scope="col" className="px-3 py-1.5 text-right font-medium">
                    Puntos
                  </th>
                  {weighted && (
                    <th scope="col" className="px-1 py-1.5 text-right font-medium">
                      Peso
                    </th>
                  )}
                  <th scope="col" className="px-3 py-1.5 text-right font-medium">
                    Aporta
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filas.map((f) => (
                  <tr key={f.season} className={f.aporta === 0 ? 'text-content-subtle' : undefined}>
                    <th scope="row" className="px-3 py-2 text-left font-normal text-content-muted">
                      {f.season.replace('-', '/')}
                    </th>
                    <td className="px-3 py-2 text-right tabular-nums text-content-muted">
                      {formatPoints(f.base)}
                    </td>
                    {weighted && (
                      <td className="px-1 py-2 text-right tabular-nums text-content-subtle">
                        ×{f.coef}
                      </td>
                    )}
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-content">
                      {formatPoints(f.aporta)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-surface-muted">
                  <th
                    scope="row"
                    colSpan={weighted ? 3 : 2}
                    className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-content-muted"
                  >
                    Total
                  </th>
                  <td className="px-3 py-2 text-right font-display text-base font-bold tabular-nums text-content">
                    {formatPoints(suma)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {descuadre && (
              <p className="border-t border-line px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                La suma no cuadra con el total de la tabla ({formatPoints(total)}).
              </p>
            )}
          </div>,
          document.body
        )}
    </>
  )
}

export default TotalBreakdown
