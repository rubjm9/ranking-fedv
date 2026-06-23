import React from 'react'
import { Trophy, Waves, Sprout } from 'lucide-react'
import { IconMars, IconVenus, IconMixedGender } from '@/components/ui/CategoryGenderIcons'

type TournamentSurface = 'BEACH' | 'GRASS' | 'INDOOR' | string
type TournamentCategory = 'OPEN' | 'WOMEN' | 'MIXED' | string

interface TournamentCategoryIconProps {
  surface: TournamentSurface
  category?: TournamentCategory | null
  size?: 'sm' | 'md'
  className?: string
  title?: string
}

const SURFACE_STYLES: Record<string, { bg: string; color: string; SurfaceIcon: typeof Waves }> = {
  GRASS: { bg: 'bg-emerald-50', color: 'text-emerald-600', SurfaceIcon: Sprout },
  BEACH: { bg: 'bg-amber-50', color: 'text-amber-600', SurfaceIcon: Waves },
  INDOOR: { bg: 'bg-violet-50', color: 'text-violet-600', SurfaceIcon: Trophy },
}

const DEFAULT_SURFACE_STYLE = {
  bg: 'bg-primary-50',
  color: 'text-primary-600',
  SurfaceIcon: Trophy,
}

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  OPEN: IconMars,
  WOMEN: IconVenus,
  MIXED: IconMixedGender,
}

const TournamentCategoryIcon: React.FC<TournamentCategoryIconProps> = ({
  surface,
  category,
  size = 'md',
  className = '',
  title,
}) => {
  const surfaceStyle = SURFACE_STYLES[surface] ?? DEFAULT_SURFACE_STYLE
  const CategoryIcon = category ? CATEGORY_ICONS[category] ?? Trophy : Trophy
  const SurfaceIcon = surfaceStyle.SurfaceIcon

  const boxSize = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const badgeSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const badgeIconSize = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'

  return (
    <div
      className={`relative flex flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-black/5 ${boxSize} ${surfaceStyle.bg} ${className}`}
      title={title}
    >
      <CategoryIcon className={`${iconSize} ${surfaceStyle.color}`} />
      <span
        className={`absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-slate-200/80 ${badgeSize}`}
        aria-hidden="true"
      >
        <SurfaceIcon className={`${badgeIconSize} ${surfaceStyle.color}`} strokeWidth={2} />
      </span>
    </div>
  )
}

export default TournamentCategoryIcon
