import React, { ReactNode } from 'react'
import { Filter, X } from 'lucide-react'

interface FilterBarProps {
  activeFiltersCount?: number
  onClearFilters?: () => void
  children: ReactNode
  className?: string
}

const FilterBar: React.FC<FilterBarProps> = ({
  activeFiltersCount = 0,
  onClearFilters,
  children,
  className = '',
}) => {
  return (
    <div className={`card mb-6 ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-500" aria-hidden="true" />
            <h2 className="text-sm font-medium text-slate-700">Filtros</h2>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                {activeFiltersCount}
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="flex items-center space-x-1 text-sm text-slate-500 hover:text-slate-700 min-h-[44px] px-2"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

export default FilterBar
