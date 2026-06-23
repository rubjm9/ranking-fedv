import React, { ReactNode } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface TableColumnFilterProps {
  label: string
  sortIcon?: 'none' | 'inactive' | 'asc' | 'desc'
  onSort?: () => void
  active?: boolean
  children?: ReactNode
}

const TableColumnFilter: React.FC<TableColumnFilterProps> = ({
  label,
  sortIcon = 'inactive',
  onSort,
  active = false,
  children,
}) => {
  const SortIcon = () => {
    if (sortIcon === 'none') return null
    if (sortIcon === 'asc') return <ArrowUp className="h-3.5 w-3.5 text-primary-600" />
    if (sortIcon === 'desc') return <ArrowDown className="h-3.5 w-3.5 text-primary-600" />
    return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
  }

  return (
    <th className="px-4 py-2 text-left align-top sm:px-6">
      {onSort ? (
        <button
          type="button"
          onClick={onSort}
          className={`inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors ${
            active ? 'text-primary-700' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>{label}</span>
          <SortIcon />
        </button>
      ) : (
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</span>
      )}
      {children && <div className="mt-1.5">{children}</div>}
    </th>
  )
}

export default TableColumnFilter
