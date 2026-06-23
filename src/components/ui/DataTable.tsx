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
      <div className={`overflow-hidden rounded-2xl border border-slate-200 shadow-sm ${className}`}>
        <table className="min-w-full divide-y divide-slate-200">
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
}

export const DataTableHeaderCell: React.FC<DataTableHeaderCellProps> = ({
  children,
  className = '',
}) => (
  <th
    scope="col"
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
  <tbody className={`bg-white divide-y divide-slate-100 ${className}`}>{children}</tbody>
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
    className={`hover:bg-secondary-50 transition-colors duration-150 ${onClick ? 'cursor-pointer' : ''} ${className}`}
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
  <td className={`px-4 py-3 text-sm text-slate-900 whitespace-nowrap ${className}`}>
    {children}
  </td>
)

export default DataTable
