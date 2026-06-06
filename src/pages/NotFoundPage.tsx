import React from 'react'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'

const NotFoundPage: React.FC = () => {
  return (
    <PageContainer className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-primary-600" />
          </div>
        </div>

        <h1 className="font-display text-6xl font-bold text-slate-300 mb-4">404</h1>

        <h2 className="font-display text-2xl font-semibold text-slate-900 mb-4">
          Página no encontrada
        </h2>

        <p className="text-slate-600 mb-8">
          La página que buscas no existe o ha sido movida.
        </p>

        <div className="space-y-4">
          <Link to="/" className="btn-primary w-full inline-flex items-center justify-center gap-2">
            <Home className="h-4 w-4" />
            Ir al inicio
          </Link>

          <button
            onClick={() => window.history.back()}
            className="btn-outline w-full inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver atrás
          </button>
        </div>
      </div>
    </PageContainer>
  )
}

export default NotFoundPage
