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
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-secondary-50">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
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
