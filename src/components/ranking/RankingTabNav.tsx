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
      className={`${sticky ? 'sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm -mx-4 px-4 sm:mx-0 sm:px-0' : ''}`}
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
              className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default RankingTabNav
