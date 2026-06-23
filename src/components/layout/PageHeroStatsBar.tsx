import React from 'react'
import { LucideIcon } from 'lucide-react'

export interface HeroStatItem {
  icon: LucideIcon
  label: string
  value: number | string
  iconClassName?: string
}

interface PageHeroStatsBarProps {
  items: HeroStatItem[]
  isLoading?: boolean
}

const PageHeroStatsBar: React.FC<PageHeroStatsBarProps> = ({
  items,
  isLoading = false,
}) => {
  return (
    <div
      className="flex gap-6 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-4 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
      role="list"
      aria-label="Estadísticas"
    >
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.label}
            role="listitem"
            className="flex min-w-[8.5rem] shrink-0 snap-start items-center gap-3 border-slate-800 md:min-w-0 md:border-l md:pl-6 first:md:border-l-0 first:md:pl-0"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center">
              <Icon
                className={`h-7 w-7 ${item.iconClassName ?? 'text-accent-400'}`}
                strokeWidth={1.5}
              />
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <div className="space-y-1.5">
                  <div className="h-7 w-12 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
                </div>
              ) : (
                <>
                  <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
                    {item.value}
                  </p>
                  <p className="truncate text-sm text-slate-400">{item.label}</p>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default PageHeroStatsBar
