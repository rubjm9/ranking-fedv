import React, { ReactNode } from 'react'

/** Espacio superior para que el contenido quede bajo la navbar fija */
export const PAGE_HERO_NAV_PADDING = 'pt-[6.5rem]'

interface PageHeroShellProps {
  children: ReactNode
  className?: string
  innerClassName?: string
}

const PageHeroShell: React.FC<PageHeroShellProps> = ({
  children,
  className = '',
  innerClassName = '',
}) => {
  return (
    <div
      className={`page-header-hero relative left-1/2 mb-8 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-slate-900 text-white ${className}`}
    >
      <div className="absolute inset-0 hero-dots" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary-950/30 via-slate-900 to-accent-950/15"
        aria-hidden="true"
      />
      <div
        className={`relative mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8 ${PAGE_HERO_NAV_PADDING} ${innerClassName}`}
      >
        {children}
      </div>
    </div>
  )
}

export default PageHeroShell
