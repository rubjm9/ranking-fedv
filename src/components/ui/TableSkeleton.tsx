import React from 'react'

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showLeadingAvatar?: boolean
  className?: string
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showLeadingAvatar = false,
  className = '',
}) => {
  return (
    <div className={`bg-surface rounded-lg shadow-sm border border-line overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-surface-muted">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-line">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    {showLeadingAvatar && colIndex === 0 ? (
                      <div className="flex items-center gap-3 animate-pulse">
                        <div className="h-8 w-8 bg-slate-200 rounded-full flex-shrink-0" />
                        <div className="h-4 bg-slate-200 rounded w-40" />
                      </div>
                    ) : (
                      <div className="h-4 bg-slate-200 rounded w-full animate-pulse" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TableSkeleton
