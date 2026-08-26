import React, { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUrlBatch } from '@/hooks/useUrlState'

interface SeasonNavigatorProps {
  seasons: string[]
  defaultSeason?: string
  calculationSeason?: string
  appliesToSeason?: string
}

const SeasonNavigator: React.FC<SeasonNavigatorProps> = ({
  seasons,
  defaultSeason,
  calculationSeason,
  appliesToSeason,
}) => {
  const [searchParams] = useSearchParams()
  // Antes escribía con un objeto literal, que machaca la query entera. Hoy no
  // se notaba porque estas rutas no llevaban otros parámetros; en cuanto los
  // llevan, se perderían.
  const escribirUrl = useUrlBatch()

  const selectedSeason = searchParams.get('temporada') || defaultSeason || seasons[0] || ''

  useEffect(() => {
    if (!searchParams.get('temporada') && defaultSeason && seasons.includes(defaultSeason)) {
      escribirUrl({ temporada: defaultSeason })
    }
  }, [defaultSeason, seasons, searchParams, escribirUrl])

  const currentIndex = useMemo(
    () => seasons.findIndex(s => s === selectedSeason),
    [seasons, selectedSeason]
  )

  const goToSeason = (season: string) => {
    escribirUrl({ temporada: season })
  }

  const goPrev = () => {
    if (currentIndex < seasons.length - 1) goToSeason(seasons[currentIndex + 1])
  }

  const goNext = () => {
    if (currentIndex > 0) goToSeason(seasons[currentIndex - 1])
  }

  if (!seasons.length) {
    return (
      <p className="text-sm text-content-subtle">No hay temporadas con coeficientes disponibles.</p>
    )
  }

  const displayCalc = calculationSeason || selectedSeason
  const displayApplies = appliesToSeason

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-content-muted">
          {displayCalc && displayApplies ? (
            <>
              Calculado con datos hasta <strong>{displayCalc}</strong> → aplica a regionales{' '}
              <strong>{displayApplies}</strong>
            </>
          ) : (
            <>Temporada <strong>{selectedSeason}</strong></>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIndex >= seasons.length - 1}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation rounded-lg border border-line text-content-muted hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Temporada anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={currentIndex <= 0}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation rounded-lg border border-line text-content-muted hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Temporada siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {seasons.map(season => (
          <button
            key={season}
            type="button"
            onClick={() => goToSeason(season)}
            className={`inline-flex items-center px-3 py-1.5 min-h-[44px] touch-manipulation rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
              season === selectedSeason
                ? 'bg-primary-600 text-white'
                : 'bg-surface-muted text-content-muted hover:bg-line'
            }`}
          >
            {season}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SeasonNavigator

export const useSelectedSeason = (seasons: string[], defaultSeason?: string) => {
  const [searchParams] = useSearchParams()
  return searchParams.get('temporada') || defaultSeason || seasons[0] || ''
}
