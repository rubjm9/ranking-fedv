import React from 'react'
import PageHeroShell from '@/components/layout/PageHeroShell'

interface DetailHeaderSkeletonProps {
  variant?: 'team' | 'default'
}

const HeroStatsBarSkeleton = () => (
  <div className="hero-stats-bar-divider">
    <div className="hero-stats-bar">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="hero-stats-bar__item">
          <div className="hero-stats-bar__icon-wrap">
            <div className="h-7 w-7 animate-pulse rounded bg-white/10" />
          </div>
          <div className="space-y-1.5">
            <div className="hero-stats-bar__skeleton-value" />
            <div className="hero-stats-bar__skeleton-label" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

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
          <HeroStatsBarSkeleton />
        </div>
      </PageHeroShell>
    )
  }

  return (
    <PageHeroShell innerClassName="pb-6">
      <div className="animate-pulse">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-4 w-16 rounded bg-white/10" />
          <div className="h-4 w-4 rounded bg-white/10" />
          <div className="h-4 w-40 rounded bg-white/10" />
        </div>
        <div className="mb-2 h-9 w-72 rounded bg-white/10" />
        <div className="h-5 w-48 rounded bg-white/10" />
        <HeroStatsBarSkeleton />
      </div>
    </PageHeroShell>
  )
}

export default DetailHeaderSkeleton
