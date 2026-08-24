import React from 'react'

const ContentGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 animate-pulse" role="status" aria-busy="true" aria-label="Cargando contenido">
      <div className="lg:col-span-2 bg-surface rounded-lg shadow-sm border border-line p-6 space-y-4">
        <div className="h-6 bg-line rounded w-40" />
        <div className="h-4 bg-line rounded w-full" />
        <div className="h-4 bg-line rounded w-full" />
        <div className="h-4 bg-line rounded w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-5 w-5 bg-line rounded" />
              <div className="h-4 bg-line rounded w-32" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-surface rounded-lg shadow-sm border border-line p-6 space-y-4">
        <div className="h-6 bg-line rounded w-36" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 bg-line rounded w-24" />
            <div className="h-4 bg-line rounded w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ContentGridSkeleton
