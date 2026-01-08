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
  variant = 'default'
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

  const activeContent = items.find(item => item.id === activeTab)?.content

  const getTabButtonClasses = (isActive: boolean) => {
    const baseClasses = 'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-t-lg'
    
    if (variant === 'pills') {
      return `${baseClasses} rounded-lg ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`
    }
    
    if (variant === 'underline') {
      return `${baseClasses} border-b-2 ${
        isActive
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`
    }
    
    // default variant
    return `${baseClasses} ${
      isActive
        ? 'bg-white text-blue-600 border-b-2 border-blue-600'
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
    }`
  }

  return (
    <div className={className}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
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
                  <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                    isActive
                      ? variant === 'pills' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
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






