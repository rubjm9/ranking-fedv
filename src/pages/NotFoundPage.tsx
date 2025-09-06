import React from 'react'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react'

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Página no encontrada
        </h2>
        
        <p className="text-gray-600 mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="btn-primary w-full"
          >
            <Home className="h-4 w-4 mr-2" />
            Ir al inicio
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver atrás
          </button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>¿Necesitas ayuda? Contacta con el soporte técnico.</p>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
