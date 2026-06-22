import React from 'react'

interface DetailHeaderSkeletonProps {
  variant?: 'team' | 'default'
}

const DetailHeaderSkeleton: React.FC<DetailHeaderSkeletonProps> = ({ variant = 'default' }) => {
  if (variant === 'team') {
    return (
      <div className="sports-header-pattern border-b border-secondary-200">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-4 bg-slate-200 rounded w-16" />
            <div className="h-4 bg-slate-200 rounded w-4" />
            <div className="h-4 bg-slate-200 rounded w-32" />
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6">
            <div className="h-24 w-24 sm:h-28 sm:w-28 bg-slate-200 rounded-full" />
            <div className="text-center sm:text-left flex-1 space-y-3">
              <div className="h-9 bg-slate-200 rounded w-64 mx-auto sm:mx-0" />
              <div className="h-5 bg-slate-200 rounded w-40 mx-auto sm:mx-0" />
              <div className="h-4 bg-slate-200 rounded w-28 mx-auto sm:mx-0" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-pulse mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 bg-slate-200 rounded w-16" />
        <div className="h-4 bg-slate-200 rounded w-4" />
        <div className="h-4 bg-slate-200 rounded w-40" />
      </div>
      <div className="h-9 bg-slate-200 rounded w-72 mb-2" />
      <div className="h-5 bg-slate-200 rounded w-32" />
    </div>
  )
}

export default DetailHeaderSkeleton
