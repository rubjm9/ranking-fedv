import React from 'react'

const RankingSummarySkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-28">
            <div className="h-3 bg-slate-200 rounded w-20 mb-3" />
            <div className="h-5 bg-slate-200 rounded w-full mb-2" />
            <div className="h-3 bg-slate-200 rounded w-16" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
              <div className="h-5 bg-slate-600 rounded w-32" />
              <div className="h-6 bg-slate-600 rounded-full w-16" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-6 w-6 bg-slate-200 rounded-full" />
                  <div className="h-8 w-8 bg-slate-200 rounded-full" />
                  <div className="flex-1 h-4 bg-slate-200 rounded" />
                  <div className="h-4 bg-slate-200 rounded w-12" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RankingSummarySkeleton
