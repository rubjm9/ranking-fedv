import React, { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedSeason = searchParams.get('temporada') || defaultSeason || seasons[0] || ''

  useEffect(() => {
    if (!searchParams.get('temporada') && defaultSeason && seasons.includes(defaultSeason)) {
      setSearchParams({ temporada: defaultSeason }, { replace: true })
    }
  }, [defaultSeason, seasons, searchParams, setSearchParams])

  const currentIndex = useMemo(
    () => seasons.findIndex(s => s === selectedSeason),
    [seasons, selectedSeason]
  )

  const goToSeason = (season: string) => {
    setSearchParams({ temporada: season }, { replace: true })
  }

  const goPrev = () => {
    if (currentIndex < seasons.length - 1) goToSeason(seasons[currentIndex + 1])
  }

  const goNext = () => {
    if (currentIndex > 0) goToSeason(seasons[currentIndex - 1])
  }

  if (!seasons.length) {
    return (
      <p className="text-sm text-slate-500">No hay temporadas con coeficientes disponibles.</p>
    )
  }

  const displayCalc = calculationSeason || selectedSeason
  const displayApplies = appliesToSeason

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-slate-600">
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
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Temporada anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={currentIndex <= 0}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              season === selectedSeason
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
