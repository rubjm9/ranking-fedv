import React, { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: ReactNode
  actions?: ReactNode
  className?: string
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className = '',
}) => {
  return (
    <header className={`page-header ${className}`}>
      {breadcrumbs && <div className="mb-4">{breadcrumbs}</div>}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </header>
  )
}

export default PageHeader
