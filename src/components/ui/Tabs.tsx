import React, { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

export interface TabItem {
  id: string
  label: string
  icon?: LucideIcon
  badge?: number | string
  content: ReactNode
}

interface TabsProps {
  items: TabItem[]
  defaultTab?: string
  onChange?: (tabId: string) => void
  className?: string
  variant?: 'default' | 'pills' | 'underline'
}

const Tabs: React.FC<TabsProps> = ({
  items,
  defaultTab,
  onChange,
  className = '',
  variant = 'pills',
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab || items[0]?.id || '')

  React.useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab)
    }
  }, [defaultTab])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  const activeContent = items.find((item) => item.id === activeTab)?.content

  const getTabButtonClasses = (isActive: boolean) => {
    const baseClasses =
      'flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-xl whitespace-nowrap'

    if (variant === 'pills') {
      return `${baseClasses} ${
        isActive
          ? 'bg-brand-subtle text-brand-strong'
          : 'text-content-subtle hover:text-content hover:bg-surface-muted'
      }`
    }

    if (variant === 'underline') {
      return `${baseClasses} rounded-none border-b-2 ${
        isActive
          ? 'border-primary-600 text-brand-strong'
          : 'border-transparent text-content-subtle hover:text-content-muted hover:border-line-strong'
      }`
    }

    return `${baseClasses} ${
      isActive
        ? 'bg-surface text-brand-strong border-b-2 border-primary-600'
        : 'text-content-subtle hover:text-content-muted hover:bg-surface-muted'
    }`
  }

  return (
    <div className={className}>
      <div className={`mb-6 ${variant === 'underline' || variant === 'default' ? 'border-b border-line' : ''}`}>
        <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Tabs" role="tablist">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={getTabButtonClasses(isActive)}
                aria-selected={isActive}
                role="tab"
                aria-controls={`tab-panel-${item.id}`}
                id={`tab-${item.id}`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                      isActive
                        ? 'bg-brand-subtle text-brand-strong'
                        : 'bg-line text-content-muted'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      <div
        role="tabpanel"
        id={`tab-panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="tab-content"
      >
        {activeContent}
      </div>
    </div>
  )
}

export default Tabs
