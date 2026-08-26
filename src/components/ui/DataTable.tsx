import React, { ReactNode } from 'react'

interface DataTableProps {
  children: ReactNode
  className?: string
  caption?: string
  darkHeader?: boolean
}

const DataTable: React.FC<DataTableProps> = ({
  children,
  className = '',
  caption,
  darkHeader = true,
}) => {
  return (
    <div className="data-table-wrapper">
      <div className={`overflow-hidden rounded-2xl border border-line shadow-sm ${className}`}>
        <table className="min-w-full divide-y divide-line">
          {caption && <caption className="sr-only">{caption}</caption>}
          {darkHeader
            ? React.Children.map(children, (child) => {
                if (!React.isValidElement(child)) return child
                if (child.type === 'thead') {
                  return React.cloneElement(child as React.ReactElement<{ className?: string }>, {
                    className: `bg-secondary-900 ${(child.props as { className?: string }).className || ''}`,
                  })
                }
                return child
              })
            : children}
        </table>
      </div>
    </div>
  )
}

interface DataTableHeadProps {
  children: ReactNode
  className?: string
}

export const DataTableHead: React.FC<DataTableHeadProps> = ({ children, className = '' }) => (
  <thead className={`bg-secondary-900 ${className}`}>{children}</thead>
)

interface DataTableHeaderCellProps {
  children: ReactNode
  className?: string
  /** Orden actual de esta columna. Omitir en columnas no ordenables. */
  sort?: 'none' | 'asc' | 'desc'
}

export const DataTableHeaderCell: React.FC<DataTableHeaderCellProps> = ({
  children,
  className = '',
  sort,
}) => (
  <th
    scope="col"
    aria-sort={
      sort === undefined
        ? undefined
        : sort === 'asc'
          ? 'ascending'
          : sort === 'desc'
            ? 'descending'
            : 'none'
    }
    className={`px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider [&_button]:uppercase ${className}`}
  >
    {children}
  </th>
)

interface DataTableBodyProps {
  children: ReactNode
  className?: string
}

export const DataTableBody: React.FC<DataTableBodyProps> = ({ children, className = '' }) => (
  <tbody className={`bg-surface divide-y divide-line ${className}`}>{children}</tbody>
)

interface DataTableRowProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export const DataTableRow: React.FC<DataTableRowProps> = ({
  children,
  className = '',
  onClick,
}) => (
  <tr
    className={`hover:bg-surface-muted transition-colors duration-150 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </tr>
)

interface DataTableCellProps {
  children: ReactNode
  className?: string
}

export const DataTableCell: React.FC<DataTableCellProps> = ({ children, className = '' }) => (
  <td className={`px-4 py-3 text-sm text-content whitespace-nowrap ${className}`}>
    {children}
  </td>
)

export default DataTable
