import React, { useEffect, useRef } from 'react'
import { LucideIcon } from 'lucide-react'

export interface RankingTab {
  id: string
  label: string
  /** Segunda línea opcional; si no se pasa, se parte `label` en el primer espacio. */
  labelSecondary?: string
  icon?: LucideIcon
}

interface RankingTabNavProps {
  tabs: RankingTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  sticky?: boolean
}

function getLabelLines(tab: RankingTab): { primary: string; secondary?: string } {
  if (tab.labelSecondary) {
    return { primary: tab.label, secondary: tab.labelSecondary }
  }
  const spaceIdx = tab.label.indexOf(' ')
  if (spaceIdx > 0) {
    return {
      primary: tab.label.slice(0, spaceIdx),
      secondary: tab.label.slice(spaceIdx + 1),
    }
  }
  return { primary: tab.label }
}

const RankingTabNav: React.FC<RankingTabNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
  sticky = true,
}) => {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const navRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = tabRefs.current[activeTab]
    if (!el) return
    // Solo ajustar scroll en viewport estrecho (carrusel); en desktop las pills ya caben.
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
      return
    }

    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab)
    const isFirst = activeIndex === 0
    const isLast = activeIndex === tabs.length - 1

    if (isFirst) {
      const nav = navRef.current
      if (nav) {
        nav.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'smooth' })
      }
      return
    }

    if (isLast) {
      const nav = navRef.current
      if (nav) {
        nav.scrollTo({ left: nav.scrollWidth - nav.clientWidth, behavior: 'smooth' })
      } else {
        el.scrollIntoView({ inline: 'end', block: 'nearest', behavior: 'smooth' })
      }
      return
    }

    el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [activeTab, tabs])

  return (
    <div
      className={
        sticky ? 'sticky top-16 z-40 nav-tabs-bar -mx-4 px-4 sm:mx-0 sm:px-0' : ''
      }
    >
      <nav
        ref={navRef}
        className="flex gap-1.5 overflow-x-auto snap-x snap-mandatory px-1 py-2 scrollbar-thin md:w-full md:gap-2 md:overflow-x-visible md:snap-none md:px-0"
        aria-label="Secciones del ranking"
        role="tablist"
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const isFirst = index === 0
          const isLast = index === tabs.length - 1
          const { primary, secondary } = getLabelLines(tab)
          const snapClass = isFirst ? 'snap-start' : isLast ? 'snap-end' : 'snap-center'

          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[tab.id] = node
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`ranking-panel-${tab.id}`}
              id={`ranking-tab-${tab.id}`}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={[
                'ranking-tab-pill relative shrink-0 flex flex-col items-center justify-center gap-0.5',
                snapClass,
                'min-h-[44px] px-1.5 py-2',
                'rounded-xl border text-center leading-tight transition-[min-width,max-width,font-size,color,background-color,border-color,box-shadow] duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                'md:flex-1 md:min-w-0 md:max-w-none md:snap-align-none md:gap-1 md:px-2 md:py-3',
                isActive
                  ? 'min-w-[6.5rem] max-w-[7.5rem] border-brand-strong/40 bg-brand-subtle text-brand-strong font-semibold shadow-sm'
                  : 'min-w-[5.5rem] max-w-[6.5rem] border-line bg-surface text-content-muted font-medium hover:bg-surface-muted hover:text-content',
              ].join(' ')}
            >
              {Icon && (
                <span
                  className={
                    isActive
                      ? 'text-accent-500'
                      : 'text-content-subtle'
                  }
                  aria-hidden="true"
                >
                  <Icon className="h-3.5 w-3.5 md:h-5 md:w-5" />
                </span>
              )}
              <span
                className={[
                  'flex flex-col items-center font-semibold transition-[font-size] duration-200 md:text-sm md:leading-tight lg:text-base',
                  isActive ? 'text-sm' : 'text-xs',
                ].join(' ')}
              >
                <span className="block">{primary}</span>
                {secondary ? (
                  <span className="block font-medium opacity-90">{secondary}</span>
                ) : null}
              </span>
              {isActive ? (
                <span
                  className="pointer-events-none absolute bottom-1 left-[18%] right-[18%] h-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-orange-500 md:bottom-1.5"
                  aria-hidden="true"
                />
              ) : null}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default RankingTabNav
