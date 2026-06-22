import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { RegionalCoefficientSeasonBreakdown } from '@/services/seasonService'
import { formatPoints } from '@/utils/rankingCalculations'
import { MODALITIES, MODALITY_LABELS } from './constants'

interface RegionalCoefficientBreakdownProps {
  breakdown: RegionalCoefficientSeasonBreakdown | null | undefined
  regionId?: string
  isLoading?: boolean
  defaultExpanded?: boolean
}

const RegionalCoefficientBreakdown: React.FC<RegionalCoefficientBreakdownProps> = ({
  breakdown,
  regionId,
  isLoading,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [activeModality, setActiveModality] = useState<string>(MODALITIES[0])

  if (isLoading) {
    return <div className="py-6 text-center text-sm text-slate-500">Calculando desglose...</div>
  }

  if (!breakdown) {
    return (
      <div className="py-6 text-center text-sm text-slate-500">
        No se pudo calcular el desglose para esta temporada.
      </div>
    )
  }

  const modalityData = breakdown.modalities.find(m => m.modality === activeModality)
  const hasManualOverrides = breakdown.modalities.some(m =>
    m.regions.some(r => r.isManualOverride)
  )

  const regionsToShow = regionId
    ? modalityData?.regions.filter(r => r.regionId === regionId) || []
    : modalityData?.regions || []

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 text-left transition-colors border-b border-slate-200"
      >
        <span className="font-medium text-slate-900">Desglose del cálculo</span>
        {expanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-6 bg-white">
          {hasManualOverrides && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Algunos coeficientes tienen ajuste manual y pueden diferir del cálculo automático.
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Ventana de 4 temporadas (CE1 y CE2)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {breakdown.windowYears.map(w => (
                <div key={w.year} className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500">{w.seasonLabel}</div>
                  <div className="text-lg font-bold text-slate-900">×{w.weight}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary-50 rounded-xl p-4">
            <p className="font-mono text-primary-900 text-center text-sm">
              coef = clamp(1.0 + (pts_región − media) / media × 0.20, 0.80, 1.20)
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {MODALITIES.map(mod => (
              <button
                key={mod}
                type="button"
                onClick={() => setActiveModality(mod)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeModality === mod
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {MODALITY_LABELS[mod]}
              </button>
            ))}
          </div>

          {modalityData && (
            <p className="text-sm text-slate-600">
              Media nacional ({MODALITY_LABELS[activeModality]}):{' '}
              <strong>{formatPoints(modalityData.nationalMean)}</strong> pts ponderados
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  {!regionId && <th className="text-left p-2 font-medium">Región</th>}
                  <th className="text-right p-2 font-medium">Pts ponderados</th>
                  <th className="text-right p-2 font-medium">Desviación</th>
                  <th className="text-right p-2 font-medium">Coeficiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {regionsToShow.map(region => (
                  <tr key={region.regionId}>
                    {!regionId && (
                      <td className="p-2 font-medium text-slate-900">{region.regionName}</td>
                    )}
                    <td className="p-2 text-right">{formatPoints(region.weightedPoints)}</td>
                    <td className="p-2 text-right text-slate-600">
                      {region.deviationFromMean >= 0 ? '+' : ''}
                      {region.deviationFromMean.toFixed(1)}%
                    </td>
                    <td className="p-2 text-right font-bold">{region.coefficient.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {regionId && regionsToShow[0] && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Contribución por año</h4>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-2 font-medium">Año</th>
                    <th className="text-right p-2 font-medium">Peso</th>
                    <th className="text-right p-2 font-medium">Pts CE1/CE2</th>
                    <th className="text-right p-2 font-medium">Pts ponderados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {regionsToShow[0].yearBreakdown.map(row => (
                    <tr key={row.year}>
                      <td className="p-2">{row.year}-{(row.year + 1).toString().slice(-2)}</td>
                      <td className="p-2 text-right">×{row.weight}</td>
                      <td className="p-2 text-right">{row.rawPoints}</td>
                      <td className="p-2 text-right font-medium">{formatPoints(row.weightedPoints)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RegionalCoefficientBreakdown
