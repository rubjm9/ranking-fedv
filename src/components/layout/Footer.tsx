import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, MapPin } from 'lucide-react'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { isAnalyticsConfigured, openCookieNotice } from '@/lib/analytics'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()
  const { isAuthenticated } = useAuth()

  return (
    <footer className="footer-pattern text-white border-t-2 border-accent-500">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <span className="font-display text-2xl font-bold text-white">
                Ranking <span className="text-accent-400">FEDV</span>
              </span>
            </div>
            <p className="text-slate-400 mb-4 max-w-md">
              Propuesta de sistema de ranking de Ultimate Frisbee en España,
              desarrollada en colaboración con la Federación Española de Disco Volador (FEDV).
              Pendiente de aprobación oficial.
            </p>
            <div className="flex space-x-4">
              <a
                href="mailto:comitedeportivo@fedv.es"
                aria-label="Enviar correo a comitedeportivo@fedv.es"
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg touch-manipulation text-slate-300 hover:text-white hover:bg-white/10 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="https://fedv.es"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visitar sitio web de FEDV"
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg touch-manipulation text-slate-300 hover:text-white hover:bg-white/10 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <MapPin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
              Enlaces rápidos
            </h3>
            <ul className="space-y-2">
              {[
                { label: 'Inicio', to: '/' },
                { label: 'Ranking', to: '/ranking' },
                { label: 'Equipos', to: '/equipos' },
                { label: 'Regiones', to: '/regiones' },
                { label: 'Campeonatos', to: '/campeonatos' },
                { label: 'Disc golf', to: '/disc-golf' },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="inline-flex items-center min-h-[44px] touch-manipulation text-slate-300 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
              Contacto
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <a href="mailto:comitedeportivo@fedv.es" className="inline-flex items-center min-h-[44px] touch-manipulation text-slate-300 text-sm hover:text-white transition-colors">
                  comitedeportivo@fedv.es
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-300 text-sm">
              © {currentYear} Federación Española de Disco Volador (FEDV).
              Todos los derechos reservados.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 md:mt-0">
              {[
                { label: 'Cómo funciona', to: '/como-funciona' },
                { label: 'Privacidad', to: '/privacy' },
                { label: 'Términos', to: '/terms' },
                ...(!isAuthenticated ? [{ label: 'Iniciar sesión', to: '/login' }] : []),
              ].map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  className="inline-flex items-center min-h-[44px] touch-manipulation text-slate-300 hover:text-white text-sm transition-colors duration-200"
                >
                  {label}
                </Link>
              ))}
              {isAnalyticsConfigured() && (
                <button
                  type="button"
                  onClick={openCookieNotice}
                  className="inline-flex items-center min-h-[44px] touch-manipulation text-slate-300 hover:text-white text-sm transition-colors duration-200"
                >
                  Cookies
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
