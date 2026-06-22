import React from 'react'

interface StatsGridSkeletonProps {
  count?: number
  className?: string
}

const StatsGridSkeleton: React.FC<StatsGridSkeletonProps> = ({ count = 4, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-slate-200 rounded-xl" />
            <div className="ml-4 flex-1 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-20" />
              <div className="h-7 bg-slate-200 rounded w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatsGridSkeleton
