import React, { ReactNode } from 'react'
import PageHeroShell from '@/components/layout/PageHeroShell'

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: ReactNode
  actions?: ReactNode
  statsBar?: ReactNode
  className?: string
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  statsBar,
  className = '',
}) => {
  const innerClassName = statsBar ? 'pb-6' : ''

  return (
    <PageHeroShell className={className} innerClassName={innerClassName}>
      {breadcrumbs && <div className="mb-3">{breadcrumbs}</div>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-3xl text-sm text-slate-400 md:text-base">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
      {statsBar && (
        <div className="-mx-4 mt-6 border-t border-primary-600/20 pt-5 sm:-mx-6 lg:-mx-8">
          {statsBar}
        </div>
      )}
    </PageHeroShell>
  )
}

export default PageHeader
