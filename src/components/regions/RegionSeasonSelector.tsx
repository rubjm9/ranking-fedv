import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUrlBatch } from '@/hooks/useUrlState'
import { getRegionalEditionLabel } from '@/utils/rankingCalculations'

interface RegionSeasonSelectorProps {
  /** Temporadas de cálculo, de la más reciente a la más antigua. */
  seasons: string[]
  selectedSeason: string
}

const flecha =
  'inline-flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation rounded-xl border border-line bg-surface text-content-muted transition-colors hover:bg-surface-muted hover:text-content disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'

/**
 * Selector de temporada de la ficha de región: controla a la vez el ranking y
 * los coeficientes.
 *
 * Compacto a propósito: seis botones en fila, encima de las siete pastillas de
 * modalidad, serían dos filas de pastillas compitiendo. El `<select>` nativo
 * abre además el selector del sistema en móvil.
 *
 * Las opciones se rotulan por edición de los regionales, que es lo que busca
 * quien consulta el seeding; el valor sigue siendo la temporada de cálculo, así
 * que los `?temporada=` que ya circulan siguen funcionando.
 */
const RegionSeasonSelector: React.FC<RegionSeasonSelectorProps> = ({ seasons, selectedSeason }) => {
  const escribirUrl = useUrlBatch()

  if (!seasons.length || !selectedSeason) return null

  const indice = seasons.indexOf(selectedSeason)
  const irA = (season: string) => escribirUrl({ temporada: season })

  return (
    <div className="flex flex-col gap-1.5 sm:items-end">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => irA(seasons[indice + 1])}
          disabled={indice < 0 || indice >= seasons.length - 1}
          className={flecha}
          aria-label="Edición anterior"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <label htmlFor="temporada-region" className="sr-only">
          Edición de los regionales
        </label>
        <select
          id="temporada-region"
          value={selectedSeason}
          onChange={e => irA(e.target.value)}
          className="min-h-[44px] cursor-pointer rounded-xl border border-brand-strong/40 bg-brand-subtle py-2 pl-3 pr-8 text-sm font-semibold text-brand-strong shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          {seasons.map(season => (
            <option key={season} value={season}>
              {getRegionalEditionLabel(season)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => irA(seasons[indice - 1])}
          disabled={indice <= 0}
          className={flecha}
          aria-label="Edición siguiente"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <p className="text-xs text-content-subtle">
        Ranking y coeficientes con datos hasta <strong className="text-content-muted">{selectedSeason}</strong>
      </p>
    </div>
  )
}

export default RegionSeasonSelector
