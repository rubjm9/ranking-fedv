import React from 'react'

interface TabsSkeletonProps {
  count?: number
}

const TabsSkeleton: React.FC<TabsSkeletonProps> = ({ count = 4 }) => {
  return (
    <div className="flex gap-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-200 rounded-full w-24" />
      ))}
    </div>
  )
}

export default TabsSkeleton
