import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Trophy, UsersRound, Calendar, MapPin } from 'lucide-react'

/**
 * Navegación primaria en la zona del pulgar, solo en móvil.
 *
 * La hamburguesa queda para lo secundario (Cómo funciona, Disc golf, legal,
 * admin). Se apoya en `env(safe-area-inset-bottom)` para no quedar bajo la
 * barra de gestos de iOS, que requiere `viewport-fit=cover` en index.html.
 */
const items = [
  { name: 'Ranking', href: '/ranking/resumen', match: '/ranking', icon: Trophy },
  { name: 'Equipos', href: '/equipos', match: '/equipos', icon: UsersRound },
  { name: 'Campeonatos', href: '/campeonatos', match: '/campeonatos', icon: Calendar },
  { name: 'Regiones', href: '/regiones', match: '/regiones', icon: MapPin },
]

const BottomNav: React.FC = () => {
  const location = useLocation()

  const isActive = (match: string) =>
    location.pathname === match || location.pathname.startsWith(`${match}/`)

  return (
    <nav
      className="bottom-nav md:hidden"
      aria-label="Navegación principal"
    >
      <ul className="flex items-stretch">
        {items.map(({ name, href, match, icon: Icon }) => {
          const active = isActive(match)
          return (
            <li key={name} className="flex-1">
              <Link
                to={href}
                aria-current={active ? 'page' : undefined}
                className={`bottom-nav__link${active ? ' bottom-nav__link--active' : ''}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-[11px] font-medium leading-none">{name}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default BottomNav
