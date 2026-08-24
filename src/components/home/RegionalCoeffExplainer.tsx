import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { regionsService } from '@/services/apiService'
import {
  DEFAULT_REGIONAL_CONFIG,
  calculateRegionalCoefficient,
} from '@/utils/rankingCalculations'

const BASE_EXAMPLE_POINTS = 100
const EQUAL_POINTS = 1000

const buildUnequalPoints = (count: number): number[] => {
  if (count <= 0) return []
  if (count === 1) return [1400]
  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0 : index / (count - 1)
    return Math.round(400 + t * 1200)
  })
}

const coefficientTone = (coefficient: number) => {
  if (coefficient > 1) return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800'
  if (coefficient < 1) return 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ring-amber-200 dark:ring-amber-800'
  return 'bg-surface-muted text-content-muted ring-line'
}

const RegionalCoeffExplainer: React.FC = () => {
  const {
    data: regionsResponse,
    isLoading,
    isError,
    isSuccess,
  } = useQuery({
    queryKey: ['regions', 'onboarding-coeff'],
    queryFn: () => regionsService.getAll(),
  })

  const regions = useMemo(() => {
    const list = regionsResponse?.data ?? []
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [regionsResponse])

  const apiFailed = isError || (isSuccess && regionsResponse?.success === false)
  const noRegions = isSuccess && !apiFailed && regions.length === 0

  const [pointsByRegion, setPointsByRegion] = useState<Record<string, number>>({})

  useEffect(() => {
    if (regions.length === 0) return
    setPointsByRegion((prev) => {
      const next: Record<string, number> = {}
      regions.forEach((region, index) => {
        next[region.id] =
          prev[region.id] ?? buildUnequalPoints(regions.length)[index] ?? EQUAL_POINTS
      })
      return next
    })
  }, [regions])

  const mean = useMemo(() => {
    if (regions.length === 0) return 0
    const total = regions.reduce((sum, region) => sum + (pointsByRegion[region.id] ?? 0), 0)
    return total / regions.length
  }, [pointsByRegion, regions])

  const rows = useMemo(
    () =>
      regions.map((region) => {
        const points = pointsByRegion[region.id] ?? 0
        const coefficient = calculateRegionalCoefficient(points, mean, DEFAULT_REGIONAL_CONFIG)
        return {
          id: region.id,
          name: region.name,
          points,
          coefficient,
          preview: Math.round(BASE_EXAMPLE_POINTS * coefficient),
        }
      }),
    [mean, pointsByRegion, regions]
  )

  const equalizeAll = () => {
    const next: Record<string, number> = {}
    regions.forEach((region) => {
      next[region.id] = EQUAL_POINTS
    })
    setPointsByRegion(next)
  }

  const applyUnequalExample = () => {
    const values = buildUnequalPoints(regions.length)
    const next: Record<string, number> = {}
    regions.forEach((region, index) => {
      next[region.id] = values[index] ?? EQUAL_POINTS
    })
    setPointsByRegion(next)
  }

  const updatePoints = (regionId: string, raw: string) => {
    const parsed = Number(raw)
    const value = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
    setPointsByRegion((prev) => ({ ...prev, [regionId]: value }))
  }

  const inputsDisabled = isLoading || apiFailed || noRegions

  return (
    <div className="space-y-5">
      <p className="text-lg text-content-muted">
        El coeficiente regional compara el rendimiento nacional de cada región con la media y
        luego traslada ese ajuste a los torneos regionales de la siguiente temporada.
      </p>

      <div className="overflow-hidden rounded-[1.75rem] border border-line bg-gradient-to-br from-surface via-surface-muted to-brand-subtle/40 p-5 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.45)]">
        <div className="mb-5">
          <p className="text-sm font-semibold tracking-[0.08em] text-brand-strong">Calculadora</p>
          <h4 className="mt-1 text-lg font-semibold text-content">
            Prueba el coeficiente con regiones reales
          </h4>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-content-muted">
            Edita los puntos nacionales y mira cómo cambia el coeficiente. El valor queda entre{' '}
            {DEFAULT_REGIONAL_CONFIG.floor.toFixed(2)} y {DEFAULT_REGIONAL_CONFIG.ceiling.toFixed(2)}.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-6 text-sm text-content-muted">
            <Loader2 className="h-4 w-4 animate-spin text-link" aria-hidden />
            Cargando regiones…
          </div>
        )}

        {!isLoading && apiFailed && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 px-4 py-4 text-sm text-amber-900 dark:text-amber-300">
            No se pudieron cargar las regiones. Revisa la conexión e inténtalo de nuevo; sin
            regiones reales la calculadora permanece desactivada.
          </div>
        )}

        {!isLoading && !apiFailed && noRegions && (
          <div className="rounded-2xl border border-line bg-surface-muted px-4 py-4 text-sm text-content-muted">
            No hay regiones disponibles en este momento. La calculadora se activará cuando existan
            regiones reales.
          </div>
        )}

        {!isLoading && !apiFailed && !noRegions && (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="rounded-2xl border border-brand-strong/30 bg-brand-subtle px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-strong">
                  Media nacional
                </p>
                <p className="mt-1 text-3xl font-semibold text-brand-strong">
                  {mean.toFixed(0)}{' '}
                  <span className="text-base font-medium text-brand-strong">pts</span>
                </p>
                <p className="mt-1 text-sm text-brand-strong/80">
                  Referencia para calcular el coeficiente de cada región
                </p>
              </div>

              <div className="flex flex-col justify-center gap-2 sm:items-stretch">
                <button
                  type="button"
                  onClick={applyUnequalExample}
                  disabled={inputsDisabled}
                  className="inline-flex items-center justify-center min-h-[44px] touch-manipulation cursor-pointer rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  Ejemplo desigual
                </button>
                <button
                  type="button"
                  onClick={equalizeAll}
                  disabled={inputsDisabled}
                  className="inline-flex items-center justify-center min-h-[44px] touch-manipulation cursor-pointer rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-content-muted transition-colors hover:border-primary-300 hover:text-brand-strong disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  Igualar todas
                </button>
              </div>
            </div>

            <div className="space-y-3 md:hidden">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
                >
                  <p className="text-base font-semibold text-content">{row.name}</p>
                  <label className="mt-3 block text-xs font-medium text-content-subtle">
                    Puntos nacionales
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={row.points}
                      disabled={inputsDisabled}
                      onChange={(event) => updatePoints(row.id, event.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base text-content focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 disabled:bg-surface-muted"
                      aria-label={`Puntos nacionales de ${row.name}`}
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${coefficientTone(row.coefficient)}`}
                    >
                      × {row.coefficient.toFixed(2)}
                    </span>
                    <p className="text-sm text-content-muted">
                      Si gana un regional ({BASE_EXAMPLE_POINTS} pts) →{' '}
                      <span className="font-semibold text-content">{row.preview} pts</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-line bg-surface-muted text-xs font-semibold text-content-subtle">
                  <tr>
                    <th className="px-4 py-3">Región</th>
                    <th className="px-4 py-3">Puntos nacionales</th>
                    <th className="px-4 py-3">Coeficiente</th>
                    <th className="px-4 py-3">Si gana un regional ({BASE_EXAMPLE_POINTS} pts)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-semibold text-content">{row.name}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          step={50}
                          value={row.points}
                          disabled={inputsDisabled}
                          onChange={(event) => updatePoints(row.id, event.target.value)}
                          className="w-32 rounded-xl border border-line bg-surface px-3 py-2 text-base text-content focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 disabled:bg-surface-muted"
                          aria-label={`Puntos nacionales de ${row.name}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${coefficientTone(row.coefficient)}`}
                        >
                          × {row.coefficient.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-content">{row.preview} pts</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-center font-mono text-xs text-content-subtle">
              coef = clamp(1.0 + (pts_region − media) / media × 0.20, 0.80, 1.20)
            </p>
          </>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface-muted p-3 text-sm text-content-muted">
          <strong className="block text-content">Solo nacionales</strong>
          Usa resultados de CE1 y CE2, nunca de torneos regionales.
        </div>
        <div className="rounded-lg border border-line bg-surface-muted p-3 text-sm text-content-muted">
          <strong className="block text-content">Por modalidad</strong>
          Se calcula por separado para cada una de las seis modalidades.
        </div>
        <div className="rounded-lg border border-line bg-surface-muted p-3 text-sm text-content-muted">
          <strong className="block text-content">Aplicación diferida</strong>
          Los coeficientes de T - 1 se aplican a los regionales de T.
        </div>
      </div>

      <p className="text-sm text-content-muted">
        El valor final siempre queda acotado entre <strong>0.80</strong> y <strong>1.20</strong>,
        redondeado en saltos de <strong>0.05</strong>.
      </p>

      <div>
        <Link
          to="/regiones"
          className="inline-block font-medium text-link hover:text-brand-strong"
        >
          Ver coeficientes por región →
        </Link>
      </div>
    </div>
  )
}

export default RegionalCoeffExplainer
