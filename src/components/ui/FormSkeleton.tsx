import React from 'react'

interface FormSkeletonProps {
  fields?: number
  className?: string
}

const FormSkeleton: React.FC<FormSkeletonProps> = ({ fields = 6, className = '' }) => {
  return (
    <div className={`space-y-6 animate-pulse ${className}`}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-10 bg-slate-200 rounded w-full" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <div className="h-10 bg-slate-200 rounded w-28" />
        <div className="h-10 bg-slate-200 rounded w-24" />
      </div>
    </div>
  )
}

export default FormSkeleton
