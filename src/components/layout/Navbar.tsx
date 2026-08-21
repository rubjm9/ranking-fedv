import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { Menu, X, Trophy, UsersRound, MapPin, Calendar, Settings, Home, ChevronDown, Info, Disc3 } from 'lucide-react'
import RankingMegaMenu from './RankingMegaMenu'
import RegionsMenu from './RegionsMenu'
import ThemeToggle from './ThemeToggle'
import { buildRegionPublicSlugById, getRegionPublicUrl, regionsService } from '@/services/apiService'
import { useNavOverHero } from '@/hooks/useNavOverHero'

const megamenuItems = [
  { label: 'Playa Mixto', to: '/ranking/beach-mixed' },
  { label: 'Playa Women', to: '/ranking/beach-women' },
  { label: 'Playa Open', to: '/ranking/beach-open' },
  { label: 'Césped Mixto', to: '/ranking/grass-mixed' },
  { label: 'Césped Women', to: '/ranking/grass-women' },
  { label: 'Césped Open', to: '/ranking/grass-open' },
  { label: 'Ranking global', to: '/ranking/general' },
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
  const menuToggleRef = useRef<HTMLButtonElement>(null)

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
    { name: 'Equipos', href: '/equipos', icon: UsersRound },
  ]

  const navigationAfterRegions = [
    { name: 'Torneos', href: '/tournaments', icon: Calendar },
    { name: 'Disc golf', href: '/disc-golf', icon: Disc3 },
    { name: 'Cómo funciona', href: '/como-funciona', icon: Info },
  ]

  /*
   * Destinos que ya ofrece la barra inferior en móvil (ver BottomNav.tsx): no se
   * repiten en el panel. Los acordeones de Ranking y Regiones sí se mantienen,
   * porque dan acceso a modalidades y regiones concretas que la barra no cubre.
   */
  const bottomNavHrefs = ['/equipos', '/tournaments']
  const notInBottomNav = (item: { href: string }) => !bottomNavHrefs.includes(item.href)

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname === href || location.pathname.startsWith(`${href}/`)
  }

  const getNavLinkClass = (href: string, mobile = false) => {
    const active = isActive(href)
    if (mobile) {
      return `nav-link nav-link--mobile text-base w-full${active ? ' nav-link--mobile-active' : ''}`
    }
    return `nav-link${active ? ' nav-link--active' : ''}`
  }

  const isOverHero = useNavOverHero(location.pathname)
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
    setRankingAccordionOpen(false)
    setRegionsAccordionOpen(false)
  }, [location.pathname])

  // Menú móvil: bloquea el scroll del fondo y permite cerrar con Escape.
  useEffect(() => {
    if (!isMenuOpen) return

    const { body } = document
    const previousOverflow = body.style.overflow
    body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
        menuToggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  const closeMobileMenu = () => {
    setIsMenuOpen(false)
    setRankingAccordionOpen(false)
    setRegionsAccordionOpen(false)
  }

  const mobileAccordionClass = (active: boolean) =>
    `w-full flex items-center justify-between gap-2 px-3 py-2 min-h-[44px] touch-manipulation rounded-lg text-base font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${
      active
        ? isOverHero
          ? 'bg-white/15 text-white'
          : 'bg-brand-subtle text-brand-strong'
        : isOverHero
          ? 'text-slate-300 hover:text-white hover:bg-white/10'
          : 'text-content-muted hover:text-content hover:bg-surface-muted'
    }`

  const mobileSubLinkClass = `flex items-center px-3 py-2 min-h-[44px] touch-manipulation rounded-lg text-sm transition-colors ${
    isOverHero
      ? 'text-slate-300 hover:text-white hover:bg-white/10'
      : 'text-content-muted hover:text-content hover:bg-surface-muted'
  }`

  const navBarTheme = isOverHero ? ' nav-bar--over-hero' : ''
  const navTitleClass = isOverHero ? 'text-white' : 'text-content'

  return (
    <nav className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 pt-3 pointer-events-none">
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 -z-10 bg-slate-900/40 pointer-events-auto"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
      <div className={`nav-bar max-w-7xl mx-auto pointer-events-auto${navBarTheme}`}>
        <div className="flex justify-between items-center h-14 px-4 sm:px-5">
          <div className="flex items-center min-w-0">
            <Link to="/" className="flex items-center min-h-[44px] touch-manipulation mr-6 lg:mr-10 shrink-0">
              <span className={`font-display text-xl font-bold ${navTitleClass}`}>
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
            <ThemeToggle isOverHero={isOverHero} />

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
                ref={menuToggleRef}
                onClick={() => (isMenuOpen ? closeMobileMenu() : setIsMenuOpen(true))}
                className={`inline-flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${
                  isOverHero
                    ? 'text-slate-200 hover:text-white hover:bg-white/10'
                    : 'text-content-muted hover:text-content hover:bg-surface-muted'
                }`}
                aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={isMenuOpen}
                aria-controls="nav-mobile-panel"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div
              id="nav-mobile-panel"
              className={`nav-mobile-panel px-3 pt-2 pb-3 space-y-1${isOverHero ? ' nav-mobile-panel--over-hero' : ''}`}
            >
            <Link
              to="/"
              className={getNavLinkClass('/', true)}
              onClick={closeMobileMenu}
            >
              <span className="nav-link__icon">
                <Home className="w-4 h-4" />
              </span>
              Inicio
            </Link>

            <div>
              <button
                onClick={() => setRankingAccordionOpen((prev) => !prev)}
                className={mobileAccordionClass(isRankingActive)}
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
                      className={mobileSubLinkClass}
                      onClick={closeMobileMenu}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {navigationBeforeRegions.filter(notInBottomNav).map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={getNavLinkClass(item.href, true)}
                  onClick={closeMobileMenu}
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
                className={mobileAccordionClass(isRegionsActive)}
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
                    className={`flex items-center px-3 py-2 min-h-[44px] touch-manipulation rounded-lg text-sm font-medium transition-colors ${
                      isOverHero
                        ? 'text-accent-400 hover:bg-white/10'
                        : 'text-brand-strong hover:bg-surface-muted'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    Ver todas
                  </Link>
                  {sortedRegions.map((region) => (
                    <Link
                      key={region.id}
                      to={getRegionPublicUrl(region, regionSlugById)}
                      className={mobileSubLinkClass}
                      onClick={closeMobileMenu}
                    >
                      {region.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {navigationAfterRegions.filter(notInBottomNav).map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={getNavLinkClass(item.href, true)}
                  onClick={closeMobileMenu}
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
              <div className="border-t border-line pt-2 mt-2">
                <Link
                  to="/admin"
                  className="nav-link nav-link--mobile text-base w-full"
                  onClick={closeMobileMenu}
                >
                  <span className="nav-link__icon">
                    <Settings className="w-4 h-4" />
                  </span>
                  Panel Admin
                </Link>
                <button
                  onClick={() => { logout(); closeMobileMenu() }}
                  className="nav-link nav-link--mobile text-base w-full"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
