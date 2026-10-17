import React from 'react'
import { Link } from 'react-router-dom'
import { IconBeach, IconGrass } from '@/components/ui/SurfaceIcons'

interface RankingMegaMenuProps {
  onClose: () => void
}

const individualCategories = [
  { label: 'Playa Mixto', to: '/ranking/beach-mixed', surface: 'beach' },
  { label: 'Playa Women', to: '/ranking/beach-women', surface: 'beach' },
  { label: 'Playa Open', to: '/ranking/beach-open', surface: 'beach' },
  { label: 'Césped Mixto', to: '/ranking/grass-mixed', surface: 'grass' },
  { label: 'Césped Women', to: '/ranking/grass-women', surface: 'grass' },
  { label: 'Césped Open', to: '/ranking/grass-open', surface: 'grass' },
]

const combinedRankings = [
  { label: 'Ranking global', to: '/ranking/general', desc: 'Todas las superficies y categorías' },
  { label: 'Ranking Playa', to: '/ranking/playa', desc: 'Mixed + Women + Open' },
  { label: 'Ranking Césped', to: '/ranking/cesped', desc: 'Mixed + Women + Open' },
  { label: 'Ranking Mixto', to: '/ranking/mixto', desc: 'Beach + Grass Mixto' },
  { label: 'Ranking Open', to: '/ranking/open', desc: 'Beach + Grass Open' },
  { label: 'Ranking Women', to: '/ranking/women', desc: 'Beach + Grass Women' },
]

const RankingMegaMenu: React.FC<RankingMegaMenuProps> = ({ onClose }) => {
  return (
    <div className="absolute top-full left-0 mt-2 w-[560px] rounded-2xl shadow-lg bg-surface border border-line z-50 overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-line">
        {/* Left column: individual categories */}
        <div className="p-4">
          <p className="text-xs font-semibold text-content-subtle uppercase tracking-wider mb-3 px-2">
            Categorías
          </p>
          <ul className="space-y-0.5">
            {individualCategories.map(({ label, to, surface }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium text-content-muted hover:bg-surface-muted hover:text-content transition-colors"
                >
                  {surface === 'beach' ? (
                    <IconBeach className="w-4 h-4 text-primary-500 shrink-0" />
                  ) : (
                    <IconGrass className="w-4 h-4 text-emerald-600 dark:text-emerald-300 shrink-0" />
                  )}
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column: combined rankings */}
        <div className="p-4">
          <p className="text-xs font-semibold text-content-subtle uppercase tracking-wider mb-3 px-2">
            Rankings combinados
          </p>
          <ul className="space-y-0.5">
            {combinedRankings.map(({ label, to, desc }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={onClose}
                  className="flex flex-col px-2 py-2 rounded-lg hover:bg-surface-muted transition-colors group"
                >
                  <span className="text-sm font-medium text-content-muted group-hover:text-content">{label}</span>
                  <span className="text-xs text-content-subtle">{desc}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line px-4 py-2.5 bg-surface-muted">
        <Link
          to="/ranking/general"
          onClick={onClose}
          className="text-xs font-medium text-link hover:text-brand-strong transition-colors"
        >
          Ver todos los rankings →
        </Link>
      </div>
    </div>
  )
}

export default RankingMegaMenu
