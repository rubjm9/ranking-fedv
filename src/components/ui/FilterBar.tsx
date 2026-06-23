import React, { ReactNode } from 'react'
import { X } from 'lucide-react'

interface FilterBarProps {
  activeFiltersCount?: number
  onClearFilters?: () => void
  children: ReactNode
  footer?: ReactNode
  className?: string
}

const FilterBar: React.FC<FilterBarProps> = ({
  activeFiltersCount = 0,
  onClearFilters,
  children,
  footer,
  className = '',
}) => {
  return (
    <div className={`card mb-6 !p-0 overflow-hidden ${className}`}>
      <div className="px-4 py-3">
        {activeFiltersCount > 0 && onClearFilters && (
          <div className="mb-2 flex items-center justify-end">
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Limpiar filtros ({activeFiltersCount})</span>
            </button>
          </div>
        )}
        {children}
      </div>
      {footer && (
        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2">
          {footer}
        </div>
      )}
    </div>
  )
}

export default FilterBar
