import React from 'react'
import { Link } from 'react-router-dom'
import { getRegionPublicUrl } from '@/services/apiService'
import { RegionalCoefficient } from '@/services/seasonService'
import { MODALITIES, MODALITY_LABELS, getCoefficientColor } from './constants'
import { formatCoefficient } from '@/utils/rankingCalculations'

interface RegionRow {
  id: string
  name: string
  slug?: string | null
}

interface RegionalCoefficientMatrixProps {
  regions: RegionRow[]
  coefficients: RegionalCoefficient[]
  season: string
  isLoading?: boolean
  slugById?: Map<string, string>
}

const RegionalCoefficientMatrix: React.FC<RegionalCoefficientMatrixProps> = ({
  regions,
  coefficients,
  season,
  isLoading,
  slugById,
}) => {
  const coeffMap = new Map<string, Record<string, number>>()
  coefficients.forEach(c => {
    if (!coeffMap.has(c.regionId)) coeffMap.set(c.regionId, {})
    coeffMap.get(c.regionId)![c.modality] = c.coefficient
  })

  const sortedRegions = [...regions].sort((a, b) => a.name.localeCompare(b.name))

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-content-subtle">Cargando coeficientes...</div>
  }

  if (!coefficients.length) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/40 p-4 text-sm text-amber-900 dark:text-amber-300">
        No hay coeficientes guardados para la temporada {season}. El desglose se calcula desde los datos de CE1/CE2.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[640px]">
        <thead>
          <tr className="bg-surface-muted">
            <th className="text-left p-2 font-medium text-content-muted sticky left-0 bg-surface-muted">Región</th>
            {/*
              Etiqueta completa en vez de la abreviatura: «PM» no se entiende sin
              descifrarla, y la pista vivía en un `title` que en táctil no se
              muestra nunca. Se parte en dos líneas para no ensanchar la columna.
            */}
            {MODALITIES.map(mod => {
              const [superficie, ...resto] = MODALITY_LABELS[mod].split(' ')
              return (
                <th key={mod} scope="col" className="p-2 text-center text-xs font-medium leading-tight text-content-muted">
                  <span className="block">{superficie}</span>
                  {resto.length > 0 && <span className="block">{resto.join(' ')}</span>}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sortedRegions.map(region => {
            const modCoefs = coeffMap.get(region.id)
            return (
              <tr key={region.id} className="hover:bg-surface-muted">
                <td className="p-2 font-medium text-content sticky left-0 bg-surface">
                  <Link
                    to={`${getRegionPublicUrl(region, slugById)}?temporada=${encodeURIComponent(season)}`}
                    className="hover:text-link transition-colors"
                  >
                    {region.name}
                  </Link>
                </td>
                {MODALITIES.map(mod => {
                  const coef = modCoefs?.[mod] ?? null
                  return (
                    <td key={mod} className="text-center p-2">
                      {coef !== null ? (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${getCoefficientColor(coef)}`}>
                          {formatCoefficient(coef)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default RegionalCoefficientMatrix
