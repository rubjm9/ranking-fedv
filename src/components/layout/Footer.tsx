import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, MapPin } from 'lucide-react'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

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
              Sistema oficial de ranking de Ultimate Frisbee en España.
              Gestionado por la Federación Española de Disco Volador (FEDV).
            </p>
            <div className="flex space-x-4">
              <a
                href="mailto:info@fedv.es"
                aria-label="Enviar correo a info@fedv.es"
                className="text-slate-400 hover:text-white transition-colors duration-200"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="https://fedv.es"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visitar sitio web de FEDV"
                className="text-slate-400 hover:text-white transition-colors duration-200"
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
                { label: 'Equipos', to: '/teams' },
                { label: 'Regiones', to: '/regions' },
                { label: 'Torneos', to: '/tournaments' },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
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
                <a href="mailto:info@fedv.es" className="text-slate-400 text-sm hover:text-white transition-colors">
                  info@fedv.es
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span className="text-slate-400 text-sm">Madrid, España</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-500 text-sm">
              © {currentYear} Federación Española de Disco Volador (FEDV).
              Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {[
                { label: 'Acerca de', to: '/about' },
                { label: 'Privacidad', to: '/privacy' },
                { label: 'Términos', to: '/terms' },
              ].map(({ label, to }) => (
                <Link key={to} to={to} className="text-slate-500 hover:text-white text-sm transition-colors duration-200">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
