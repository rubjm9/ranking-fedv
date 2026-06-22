import React, { useMemo } from 'react'

interface PointsCurveTableProps {
  title: string
  description: React.ReactNode
  getPoints: (position: number) => number
  expanded: boolean
  previewPositions?: number[]
  maxExpandedPositions?: number
}

const DEFAULT_PREVIEW = [1, 2, 3, 8, 9, 16]

type PositionRow = {
  position: number
  gapBefore?: { from: number; to: number }
}

const buildTableRows = (positions: number[]): PositionRow[] =>
  positions.map((position, index) => {
    if (index === 0) {
      return { position }
    }

    const previous = positions[index - 1]
    if (position - previous > 1) {
      return {
        position,
        gapBefore: { from: previous + 1, to: position - 1 },
      }
    }

    return { position }
  })

const PointsCurveTable: React.FC<PointsCurveTableProps> = ({
  title,
  description,
  getPoints,
  expanded,
  previewPositions = DEFAULT_PREVIEW,
  maxExpandedPositions = 32,
}) => {
  const allPositions = Array.from({ length: maxExpandedPositions }, (_, index) => index + 1)
  const visiblePositions = expanded ? allPositions : previewPositions
  const tableRows = useMemo(() => buildTableRows(visiblePositions), [visiblePositions])

  return (
    <div className="border border-slate-200 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-3">{title}</h3>
      <div className="text-slate-600 text-sm mb-4">{description}</div>

      <div
        className={`transition-[max-height] duration-500 ease-in-out ${
          expanded ? 'max-h-none overflow-visible' : 'max-h-[360px] overflow-hidden'
        }`}
      >
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-2 pr-4 text-left font-medium text-slate-500">Puesto</th>
              <th className="py-2 text-right font-medium text-slate-500">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, index) => {
              const gapLabel = row.gapBefore
                ? row.gapBefore.from === row.gapBefore.to
                  ? `${row.gapBefore.from}º`
                  : `${row.gapBefore.from}º – ${row.gapBefore.to}º`
                : undefined

              return (
                <tr key={row.position}>
                  <td
                    colSpan={2}
                    className={`p-0 ${row.gapBefore ? '' : index > 0 ? 'border-t border-slate-100' : ''}`}
                  >
                    {row.gapBefore && (
                      <div
                        className="flex items-center gap-2 pt-2.5"
                        aria-hidden
                        title={`Puestos omitidos: ${gapLabel}`}
                      >
                        <span className="h-px flex-1 border-t border-dotted border-slate-300" />
                        <span className="shrink-0 text-[11px] leading-none text-slate-400">···</span>
                        <span className="h-px flex-1 border-t border-dotted border-slate-300" />
                      </div>
                    )}
                    <div className={`grid grid-cols-2 py-2 ${row.gapBefore ? 'pt-1.5' : ''}`}>
                      <span className="pr-4 text-slate-700">{row.position}º</span>
                      <span className="text-right font-medium text-slate-900">
                        {getPoints(row.position)} pts
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PointsCurveTable
