import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
  variant?: 'light' | 'dark'
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = '',
  variant = 'light',
}) => {
  // La variante `dark` vive sobre un hero siempre oscuro: conserva grises fijos.
  const linkClass =
    variant === 'dark'
      ? 'text-slate-300 hover:text-white'
      : 'text-content-subtle hover:text-content'
  const currentClass = variant === 'dark' ? 'text-white font-medium' : 'text-content font-medium'
  const iconClass =
    variant === 'dark'
      ? 'text-slate-300 hover:text-white'
      : 'text-content-subtle hover:text-content'
  const chevronClass = variant === 'dark' ? 'text-slate-400' : 'text-content-subtle'

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <Link
        to="/"
        className={`${iconClass} inline-flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
        aria-label="Inicio"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className={`h-4 w-4 ${chevronClass}`} aria-hidden="true" />
          {item.href && index < items.length - 1 ? (
            <Link
              to={item.href}
              className={`${linkClass} inline-flex items-center min-h-[44px] touch-manipulation transition-colors rounded-lg px-1 focus:outline-none focus:ring-2 focus:ring-primary-500`}
            >
              {item.label}
            </Link>
          ) : (
            <span className={currentClass} aria-current="page">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

export default Breadcrumbs
