import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { Menu, X, Trophy, Users, MapPin, Calendar, Settings, Home, Info } from 'lucide-react'

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, logout } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Ranking', href: '/ranking', icon: Trophy },
    { name: 'Equipos', href: '/teams', icon: Users },
    { name: 'Regiones', href: '/regions', icon: MapPin },
    { name: 'Torneos', href: '/tournaments', icon: Calendar },
    { name: 'Cómo funciona', href: '/about', icon: Info },
  ]

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname === href || location.pathname.startsWith(`${href}/`)
  }

  const getNavLinkClass = (href: string, mobile = false) => {
    const active = isActive(href)
    if (mobile) {
      return `nav-link text-base py-2 w-full${active ? ' nav-link--mobile-active' : ''}`
    }
    return `nav-link${active ? ' nav-link--active' : ''}`
  }

  return (
    <nav className="nav-bar sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center mr-10">
              <span className="font-display text-xl font-bold text-slate-900">
                Ranking <span className="text-accent-500">FEDV</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex md:items-center md:gap-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={getNavLinkClass(item.href)}
                  >
                    {Icon && (
                      <span className="nav-link__icon">
                        <Icon className="w-4 h-4" />
                      </span>
                    )}
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <div className="flex items-center gap-3">
                <Link to="/admin" className="btn-primary text-sm inline-flex items-center gap-1.5">
                  <Settings className="w-4 h-4" />
                  Admin
                </Link>
                <button onClick={logout} className="btn-outline text-sm">
                  Cerrar sesión
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
                aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="nav-mobile-panel px-3 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={getNavLinkClass(item.href, true)}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {Icon && (
                    <span className="nav-link__icon">
                      <Icon className="w-4 h-4" />
                    </span>
                  )}
                  {item.name}
                </Link>
              )
            })}

            {isAuthenticated && (
              <>
                <div className="border-t border-slate-100 pt-2 mt-2">
                  <Link
                    to="/admin"
                    className="nav-link text-base py-2 w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="nav-link__icon">
                      <Settings className="w-4 h-4" />
                    </span>
                    Panel Admin
                  </Link>
                  <button
                    onClick={() => { logout(); setIsMenuOpen(false) }}
                    className="nav-link text-base py-2 w-full"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
