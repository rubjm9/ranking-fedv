import React from 'react'
import { LucideIcon } from 'lucide-react'

export interface RankingTab {
  id: string
  label: string
  icon?: LucideIcon
}

interface RankingTabNavProps {
  tabs: RankingTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  sticky?: boolean
}

const RankingTabNav: React.FC<RankingTabNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
  sticky = true,
}) => {
  return (
    <div
      className={`${sticky ? 'sticky top-16 z-40 nav-tabs-bar -mx-4 px-4 sm:mx-0 sm:px-0' : ''}`}
    >
      <nav
        className="flex gap-1 overflow-x-auto py-2 scrollbar-thin"
        aria-label="Secciones del ranking"
        role="tablist"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`ranking-panel-${tab.id}`}
              id={`ranking-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`nav-link min-h-[44px] whitespace-nowrap${isActive ? ' nav-link--active' : ''}`}
            >
              {Icon && (
                <span className="nav-link__icon">
                  <Icon className="w-4 h-4" />
                </span>
              )}
              {tab.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default RankingTabNav
