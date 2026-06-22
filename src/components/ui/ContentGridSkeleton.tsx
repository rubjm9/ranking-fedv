import React from 'react'

const ContentGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 animate-pulse">
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="h-6 bg-slate-200 rounded w-40" />
        <div className="h-4 bg-slate-200 rounded w-full" />
        <div className="h-4 bg-slate-200 rounded w-full" />
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-5 w-5 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-200 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="h-6 bg-slate-200 rounded w-36" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="h-4 bg-slate-200 rounded w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ContentGridSkeleton
