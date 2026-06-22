import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { Menu, X, Trophy, Users, MapPin, Calendar, Settings, Home, ChevronDown, Info } from 'lucide-react'
import RankingMegaMenu from './RankingMegaMenu'

const megamenuItems = [
  { label: 'Playa Mixto', to: '/ranking/beach-mixed' },
  { label: 'Playa Women', to: '/ranking/beach-women' },
  { label: 'Playa Open', to: '/ranking/beach-open' },
  { label: 'Césped Mixto', to: '/ranking/grass-mixed' },
  { label: 'Césped Women', to: '/ranking/grass-women' },
  { label: 'Césped Open', to: '/ranking/grass-open' },
  { label: 'Ranking General', to: '/ranking/general' },
  { label: 'Ranking Playa', to: '/ranking/playa' },
  { label: 'Ranking Césped', to: '/ranking/cesped' },
  { label: 'Ranking Mixto', to: '/ranking/mixto' },
  { label: 'Ranking Open', to: '/ranking/open' },
  { label: 'Ranking Women', to: '/ranking/women' },
]

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [rankingMenuOpen, setRankingMenuOpen] = useState(false)
  const [rankingAccordionOpen, setRankingAccordionOpen] = useState(false)
  const { isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const rankingMenuRef = useRef<HTMLDivElement>(null)

  const navigation = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Equipos', href: '/equipos', icon: Users },
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

  const isRankingActive = location.pathname.startsWith('/ranking')

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rankingMenuRef.current && !rankingMenuRef.current.contains(e.target as Node)) {
        setRankingMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setRankingMenuOpen(false)
    setIsMenuOpen(false)
  }, [location.pathname])

  return (
    <nav className="nav-bar sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center mr-10">
              <span className="font-display text-xl font-bold text-slate-900">
                Ranking <span className="text-accent-500">FEDV</span>
              </span>
            </Link>

            <div className="hidden md:flex md:items-center md:gap-1">
              {navigation.slice(0, 1).map((item) => {
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

              <div className="relative" ref={rankingMenuRef}>
                <button
                  onClick={() => setRankingMenuOpen((prev) => !prev)}
                  className={`nav-link${isRankingActive ? ' nav-link--active' : ''}`}
                >
                  <span className="nav-link__icon">
                    <Trophy className="w-4 h-4" />
                  </span>
                  Ranking
                  <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${rankingMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {rankingMenuOpen && (
                  <RankingMegaMenu onClose={() => setRankingMenuOpen(false)} />
                )}
              </div>

              {navigation.slice(1).map((item) => {
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

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="nav-mobile-panel px-3 pt-2 pb-3 space-y-1">
            {navigation.slice(0, 1).map((item) => {
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

            <div>
              <button
                onClick={() => setRankingAccordionOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 ${
                  isRankingActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Ranking
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${rankingAccordionOpen ? 'rotate-180' : ''}`} />
              </button>
              {rankingAccordionOpen && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {megamenuItems.map(({ label, to }) => (
                    <Link
                      key={to}
                      to={to}
                      className="flex items-center px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {navigation.slice(1).map((item) => {
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
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
