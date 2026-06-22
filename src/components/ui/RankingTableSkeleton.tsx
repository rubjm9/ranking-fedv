import React from 'react'

interface RankingTableSkeletonProps {
  rows?: number
  seasonColumns?: number
}

const RankingTableSkeleton: React.FC<RankingTableSkeletonProps> = ({
  rows = 10,
  seasonColumns = 4,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 w-16">
                <div className="h-3 bg-slate-200 rounded w-12" />
              </th>
              <th className="px-4 py-3 w-16">
                <div className="h-3 bg-slate-200 rounded w-12" />
              </th>
              <th className="px-4 py-3">
                <div className="h-3 bg-slate-200 rounded w-16" />
              </th>
              {Array.from({ length: seasonColumns }).map((_, i) => (
                <th key={i} className="px-4 py-3 w-20">
                  <div className="h-3 bg-slate-200 rounded w-14 ml-auto" />
                </th>
              ))}
              <th className="px-4 py-3 w-20">
                <div className="h-3 bg-slate-200 rounded w-12 ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                <td className="px-4 py-3">
                  <div className="h-4 bg-slate-200 rounded w-6" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-slate-200 rounded w-8" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-slate-200 rounded-full flex-shrink-0" />
                    <div className="h-4 bg-slate-200 rounded w-32" />
                  </div>
                </td>
                {Array.from({ length: seasonColumns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <div className="h-4 bg-slate-200 rounded w-10 ml-auto" />
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="h-4 bg-slate-200 rounded w-12 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RankingTableSkeleton
