import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { Menu, X, Trophy, Users, MapPin, Calendar, Settings, Home, ChevronDown, Info } from 'lucide-react'
import RankingMegaMenu from './RankingMegaMenu'
import RegionsMenu from './RegionsMenu'
import { buildRegionPublicSlugById, getRegionPublicUrl, regionsService } from '@/services/apiService'

const megamenuItems = [
  { label: 'Playa Mixto', to: '/ranking/beach-mixed' },
  { label: 'Playa Women', to: '/ranking/beach-women' },
  { label: 'Playa Open', to: '/ranking/beach-open' },
  { label: 'Césped Mixto', to: '/ranking/grass-mixed' },
  { label: 'Césped Women', to: '/ranking/grass-women' },
  { label: 'Césped Open', to: '/ranking/grass-open' },
  { label: 'Rankings combinados', to: '/ranking/general' },
  { label: 'Ranking Playa', to: '/ranking/playa' },
  { label: 'Ranking Césped', to: '/ranking/cesped' },
  { label: 'Ranking Mixto', to: '/ranking/mixto' },
  { label: 'Ranking Open', to: '/ranking/open' },
  { label: 'Ranking Women', to: '/ranking/women' },
]

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [rankingMenuOpen, setRankingMenuOpen] = useState(false)
  const [regionsMenuOpen, setRegionsMenuOpen] = useState(false)
  const [rankingAccordionOpen, setRankingAccordionOpen] = useState(false)
  const [regionsAccordionOpen, setRegionsAccordionOpen] = useState(false)
  const { isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const rankingMenuRef = useRef<HTMLDivElement>(null)
  const regionsMenuRef = useRef<HTMLDivElement>(null)

  const { data: regionsData } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsService.getAll(),
  })

  const regionSlugById = useMemo(
    () => buildRegionPublicSlugById(regionsData?.data || []),
    [regionsData?.data]
  )

  const sortedRegions = useMemo(
    () => [...(regionsData?.data || [])].sort((a, b) => a.name.localeCompare(b.name)),
    [regionsData?.data]
  )

  const navigationBeforeRegions = [
    { name: 'Equipos', href: '/equipos', icon: Users },
  ]

  const navigationAfterRegions = [
    { name: 'Torneos', href: '/tournaments', icon: Calendar },
    { name: 'Cómo funciona', href: '/como-funciona', icon: Info },
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
  const isRegionsActive = location.pathname === '/regiones' || location.pathname.startsWith('/regiones/')

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rankingMenuRef.current && !rankingMenuRef.current.contains(e.target as Node)) {
        setRankingMenuOpen(false)
      }
      if (regionsMenuRef.current && !regionsMenuRef.current.contains(e.target as Node)) {
        setRegionsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setRankingMenuOpen(false)
    setRegionsMenuOpen(false)
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
              <Link to="/" className={getNavLinkClass('/')}>
                <span className="nav-link__icon">
                  <Home className="w-4 h-4" />
                </span>
                Inicio
              </Link>

              <div className="relative" ref={rankingMenuRef}>
                <button
                  onClick={() => {
                    setRegionsMenuOpen(false)
                    setRankingMenuOpen((prev) => !prev)
                  }}
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

              {navigationBeforeRegions.map((item) => {
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

              <div className="relative" ref={regionsMenuRef}>
                <button
                  onClick={() => {
                    setRankingMenuOpen(false)
                    setRegionsMenuOpen((prev) => !prev)
                  }}
                  className={`nav-link${isRegionsActive ? ' nav-link--active' : ''}`}
                >
                  <span className="nav-link__icon">
                    <MapPin className="w-4 h-4" />
                  </span>
                  Regiones
                  <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${regionsMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {regionsMenuOpen && (
                  <RegionsMenu onClose={() => setRegionsMenuOpen(false)} />
                )}
              </div>

              {navigationAfterRegions.map((item) => {
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
            <Link
              to="/"
              className={getNavLinkClass('/', true)}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="nav-link__icon">
                <Home className="w-4 h-4" />
              </span>
              Inicio
            </Link>

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

            {navigationBeforeRegions.map((item) => {
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
                onClick={() => setRegionsAccordionOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 ${
                  isRegionsActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Regiones
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${regionsAccordionOpen ? 'rotate-180' : ''}`} />
              </button>
              {regionsAccordionOpen && (
                <div className="ml-6 mt-1 space-y-0.5">
                  <Link
                    to="/regiones"
                    className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-slate-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Ver todas
                  </Link>
                  {sortedRegions.map((region) => (
                    <Link
                      key={region.id}
                      to={getRegionPublicUrl(region, regionSlugById)}
                      className="flex items-center px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {region.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {navigationAfterRegions.map((item) => {
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
