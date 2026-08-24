import React from 'react'

interface TabsSkeletonProps {
  count?: number
}

const TabsSkeleton: React.FC<TabsSkeletonProps> = ({ count = 4 }) => {
  return (
    <div className="flex gap-2 animate-pulse" role="status" aria-busy="true" aria-label="Cargando pestañas">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-10 bg-line rounded-full w-24" />
      ))}
    </div>
  )
}

export default TabsSkeleton
