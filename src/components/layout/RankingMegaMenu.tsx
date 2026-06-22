import React from 'react'
import { Link } from 'react-router-dom'

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
  { label: 'Rankings combinados', to: '/ranking/general', desc: 'Todas las superficies' },
  { label: 'Ranking Playa', to: '/ranking/playa', desc: 'Mixed + Women + Open' },
  { label: 'Ranking Césped', to: '/ranking/cesped', desc: 'Mixed + Women + Open' },
  { label: 'Ranking Mixto', to: '/ranking/mixto', desc: 'Beach + Grass Mixto' },
  { label: 'Ranking Open', to: '/ranking/open', desc: 'Beach + Grass Open' },
  { label: 'Ranking Women', to: '/ranking/women', desc: 'Beach + Grass Women' },
]

const IconBeach: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M3 16c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M3 20c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

const IconGrass: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M3 20h18" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 20v-4m3 4v-5m3 5v-4m3 4v-6m3 6v-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 15l-1-2m4 2l-1-2m4 2l-1-2m4 2l-1-2m4 2l-1-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const RankingMegaMenu: React.FC<RankingMegaMenuProps> = ({ onClose }) => {
  return (
    <div className="absolute top-full left-0 mt-2 w-[560px] rounded-2xl shadow-lg bg-white border border-slate-100 z-50 overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-slate-100">
        {/* Left column: individual categories */}
        <div className="p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
            Categorías
          </p>
          <ul className="space-y-0.5">
            {individualCategories.map(({ label, to, surface }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  {surface === 'beach' ? (
                    <IconBeach className="w-4 h-4 text-primary-500 shrink-0" />
                  ) : (
                    <IconGrass className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column: combined rankings */}
        <div className="p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
            Rankings combinados
          </p>
          <ul className="space-y-0.5">
            {combinedRankings.map(({ label, to, desc }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={onClose}
                  className="flex flex-col px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
                  <span className="text-xs text-slate-400">{desc}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50">
        <Link
          to="/ranking/general"
          onClick={onClose}
          className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          Ver todos los rankings →
        </Link>
      </div>
    </div>
  )
}

export default RankingMegaMenu
