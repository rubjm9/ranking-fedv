import React, { ReactNode } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface TableColumnFilterProps {
  label: string
  sortIcon?: 'none' | 'inactive' | 'asc' | 'desc'
  onSort?: () => void
  active?: boolean
  children?: ReactNode
  rowSpan?: number
  colSpan?: number
  className?: string
}

const TableColumnFilter: React.FC<TableColumnFilterProps> = ({
  label,
  sortIcon = 'inactive',
  onSort,
  active = false,
  children,
  rowSpan,
  colSpan,
  className = '',
}) => {
  const SortIcon = () => {
    if (sortIcon === 'none') return null
    if (sortIcon === 'asc') return <ArrowUp className="h-3.5 w-3.5 text-link" />
    if (sortIcon === 'desc') return <ArrowDown className="h-3.5 w-3.5 text-link" />
    return <ArrowUpDown className="h-3.5 w-3.5 text-content-subtle" />
  }

  /**
   * `aria-sort` no existía en ninguna tabla del proyecto: un lector de pantalla
   * no tenía forma de saber por qué columna está ordenada la tabla. Se deriva
   * del sortIcon que ya se recibe, así que una sola edición cubre las 19
   * cabeceras de torneos, torneos públicos y torneos de administración.
   */
  const ariaSort =
    sortIcon === 'asc' ? 'ascending' : sortIcon === 'desc' ? 'descending' : undefined

  return (
    <th
      scope="col"
      rowSpan={rowSpan}
      colSpan={colSpan}
      aria-sort={onSort ? ariaSort ?? 'none' : undefined}
      className={`px-4 py-2 text-left align-top sm:px-6 ${className}`}
    >
      {onSort ? (
        <button
          type="button"
          onClick={onSort}
          aria-label={`Ordenar por ${label}`}
          className={`inline-flex items-center gap-1 min-h-[44px] touch-manipulation text-xs font-medium uppercase tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
            active ? 'text-brand-strong' : 'text-content-muted hover:text-content'
          }`}
        >
          <span>{label}</span>
          <SortIcon />
        </button>
      ) : (
        <span className="text-xs font-medium uppercase tracking-wider text-content-subtle">{label}</span>
      )}
      {children && <div className="mt-1.5">{children}</div>}
    </th>
  )
}

export default TableColumnFilter
