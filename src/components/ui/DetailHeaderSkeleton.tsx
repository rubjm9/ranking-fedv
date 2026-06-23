import React from 'react'
import PageHeroShell from '@/components/layout/PageHeroShell'

interface DetailHeaderSkeletonProps {
  variant?: 'team' | 'default'
}

const DetailHeaderSkeleton: React.FC<DetailHeaderSkeletonProps> = ({ variant = 'default' }) => {
  if (variant === 'team') {
    return (
      <PageHeroShell className="mb-0 border-b border-slate-800" innerClassName="pb-6">
        <div className="animate-pulse">
          <div className="mb-6 flex items-center gap-2">
            <div className="h-4 w-16 rounded bg-white/10" />
            <div className="h-4 w-4 rounded bg-white/10" />
            <div className="h-4 w-32 rounded bg-white/10" />
          </div>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10">
            <div className="h-24 w-24 rounded-full bg-white/10 sm:h-28 sm:w-28" />
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="mx-auto h-9 w-64 rounded bg-white/10 sm:mx-0" />
              <div className="mx-auto h-5 w-40 rounded bg-white/10 sm:mx-0" />
              <div className="mx-auto h-4 w-28 rounded bg-white/10 sm:mx-0" />
            </div>
          </div>
          <div className="-mx-4 mt-6 border-t border-primary-600/20 pt-5 sm:-mx-6 lg:-mx-8">
            <div className="flex gap-6 overflow-x-auto pb-1 md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex min-w-[8.5rem] shrink-0 items-center gap-3 md:min-w-0 md:border-l md:border-slate-800 md:pl-6 first:md:border-l-0 first:md:pl-0">
                  <div className="h-12 w-12 shrink-0 rounded bg-white/10" />
                  <div className="space-y-1.5">
                    <div className="h-7 w-12 rounded bg-white/10" />
                    <div className="h-3 w-20 rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageHeroShell>
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
