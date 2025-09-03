import React from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Mail, MapPin, Phone } from 'lucide-react'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Ranking FEDV</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Sistema oficial de ranking de Ultimate Frisbee en España. 
              Gestionado por la Federación Española de Deportes de Vuelo (FEDV).
            </p>
            <div className="flex space-x-4">
              <a
                href="mailto:info@fedv.es"
                className="text-gray-300 hover:text-white transition-colors duration-200"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="https://fedv.es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors duration-200"
              >
                <MapPin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Enlaces rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  to="/ranking"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Ranking
                </Link>
              </li>
              <li>
                <Link
                  to="/teams"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Equipos
                </Link>
              </li>
              <li>
                <Link
                  to="/regions"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Regiones
                </Link>
              </li>
              <li>
                <Link
                  to="/tournaments"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Torneos
                </Link>
              </li>
            </ul>
          </div>

          {/* Información de contacto */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">info@fedv.es</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">+34 XXX XXX XXX</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">Madrid, España</span>
              </div>
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} Federación Española de Deportes de Vuelo (FEDV). 
              Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                to="/about"
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Acerca de
              </Link>
              <Link
                to="/privacy"
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Privacidad
              </Link>
              <Link
                to="/terms"
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Términos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
