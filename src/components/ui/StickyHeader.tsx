import React from 'react'
import { LucideIcon } from 'lucide-react'
import TeamLogo from './TeamLogo'

interface StickyHeaderProps {
  teamName: string
  teamLogo?: string | null
  globalPosition?: number
  totalPoints: number
  activeTab?: string
  onTabChange?: (tabId: string) => void
  tabs?: Array<{ id: string; label: string; icon?: LucideIcon; badge?: number }>
  actions?: React.ReactNode
}

const StickyHeader: React.FC<StickyHeaderProps> = ({
  teamName,
  teamLogo,
  globalPosition,
  totalPoints,
  activeTab,
  onTabChange,
  tabs = [],
  actions,
}) => {
  const [isSticky, setIsSticky] = React.useState(false)

  React.useEffect(() => {
    let frame = 0
    const handleScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setIsSticky(window.scrollY > 200)
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  if (!isSticky) return null

  /*
   * Oculto en móvil: compartía `fixed top-0 z-50` con la navbar y, al ganar por
   * orden en el DOM, tapaba el botón del menú (un tap sobre el hamburguesa
   * activaba "Compartir"). Sus tabs son `hidden md:flex`, así que en móvil no
   * aportaba ninguna función a cambio. En ≥md se sitúa bajo la navbar.
   */
  return (
    <div className="nav-bar hidden md:block fixed top-[4.75rem] left-0 right-0 z-30 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <TeamLogo logo={teamLogo} name={teamName} size="sm" className="flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-bold text-content truncate">{teamName}</h2>
              <div className="flex items-center gap-4 text-xs text-content-muted">
                {globalPosition && (
                  <span>
                    Ranking global: <strong className="text-content">#{globalPosition}</strong>
                  </span>
                )}
                <span>
                  Puntos: <strong className="text-content">{totalPoints.toFixed(1)}</strong>
                </span>
              </div>
            </div>
          </div>

          {tabs.length > 0 && (
            <nav className="hidden md:flex items-center gap-1 mx-4" aria-label="Tabs del equipo">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    className={`nav-link min-h-[44px]${isActive ? ' nav-link--active' : ''}`}
                  >
                    {Icon && (
                      <span className="nav-link__icon">
                        <Icon className="h-4 w-4" />
                      </span>
                    )}
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span
                        className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                          isActive ? 'bg-accent-100 dark:bg-accent-950/50 text-accent-800 dark:text-accent-300' : 'bg-line text-content-muted'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          )}

          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
      </div>
    </div>
  )
}

export default StickyHeader
