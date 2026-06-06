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
  const linkClass =
    variant === 'dark'
      ? 'text-slate-400 hover:text-white'
      : 'text-slate-500 hover:text-slate-700'
  const currentClass = variant === 'dark' ? 'text-white font-medium' : 'text-slate-900 font-medium'
  const iconClass = variant === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'
  const chevronClass = variant === 'dark' ? 'text-slate-500' : 'text-slate-400'

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <Link
        to="/"
        className={`${iconClass} transition-colors rounded-lg p-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500`}
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
              className={`${linkClass} transition-colors rounded-lg px-1 focus:outline-none focus:ring-2 focus:ring-primary-500`}
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
