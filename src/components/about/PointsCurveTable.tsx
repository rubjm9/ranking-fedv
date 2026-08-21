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
    <div className="border border-line rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-content mb-3">{title}</h3>
      <div className="text-content-muted text-sm mb-4">{description}</div>

      <div
        className={`transition-[max-height] duration-500 ease-in-out ${
          expanded ? 'max-h-none overflow-visible' : 'max-h-[360px] overflow-hidden'
        }`}
      >
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="py-2 pr-4 text-left font-medium text-content-subtle">Puesto</th>
              <th className="py-2 text-right font-medium text-content-subtle">Puntos</th>
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
                    className={`p-0 ${row.gapBefore ? '' : index > 0 ? 'border-t border-line' : ''}`}
                  >
                    {row.gapBefore && (
                      <div
                        className="flex items-center gap-2 pt-2.5"
                        aria-hidden
                        title={`Puestos omitidos: ${gapLabel}`}
                      >
                        <span className="h-px flex-1 border-t border-dotted border-line-strong" />
                        <span className="shrink-0 text-[11px] leading-none text-content-subtle">···</span>
                        <span className="h-px flex-1 border-t border-dotted border-line-strong" />
                      </div>
                    )}
                    <div className={`grid grid-cols-2 py-2 ${row.gapBefore ? 'pt-1.5' : ''}`}>
                      <span className="pr-4 text-content-muted">{row.position}º</span>
                      <span className="text-right font-medium text-content">
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
