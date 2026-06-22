import React from 'react'
import { Link } from 'react-router-dom'
import { getRegionPublicUrl } from '@/services/apiService'
import { RegionalCoefficient } from '@/services/seasonService'
import { MODALITIES, MODALITY_LABELS, MODALITY_SHORT, getCoefficientColor } from './constants'

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
}

const RegionalCoefficientMatrix: React.FC<RegionalCoefficientMatrixProps> = ({
  regions,
  coefficients,
  season,
  isLoading,
}) => {
  const coeffMap = new Map<string, Record<string, number>>()
  coefficients.forEach(c => {
    if (!coeffMap.has(c.regionId)) coeffMap.set(c.regionId, {})
    coeffMap.get(c.regionId)![c.modality] = c.coefficient
  })

  const sortedRegions = [...regions].sort((a, b) => a.name.localeCompare(b.name))

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-slate-500">Cargando coeficientes...</div>
  }

  if (!coefficients.length) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        No hay coeficientes guardados para la temporada {season}. El desglose se calcula desde los datos de CE1/CE2.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[640px]">
        <thead>
          <tr className="bg-slate-50">
            <th className="text-left p-2 font-medium text-slate-700 sticky left-0 bg-slate-50">Región</th>
            {MODALITIES.map(mod => (
              <th key={mod} className="text-center p-2 font-medium text-slate-700 text-xs" title={MODALITY_LABELS[mod]}>
                {MODALITY_SHORT[mod]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedRegions.map(region => {
            const modCoefs = coeffMap.get(region.id)
            return (
              <tr key={region.id} className="hover:bg-slate-50">
                <td className="p-2 font-medium text-slate-900 sticky left-0 bg-white">
                  <Link
                    to={`${getRegionPublicUrl(region)}?temporada=${encodeURIComponent(season)}`}
                    className="hover:text-primary-600 transition-colors"
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
                          {coef.toFixed(2)}
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
