import React from 'react'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'

const TermsPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Términos de uso"
        subtitle="Condiciones de uso del sistema de ranking FEDV."
      />
      <div className="card prose prose-slate max-w-none">
        <p className="text-slate-600">
          El uso de este sitio implica la aceptación de los presentes términos.
          El ranking publicado es oficial y gestionado por la FEDV.
        </p>
        <h2 className="font-display text-xl font-semibold text-slate-900 mt-6 mb-3">
          Uso del contenido
        </h2>
        <p className="text-slate-600">
          Los datos de ranking, equipos y torneos pueden consultarse con fines
          informativos. La reproducción comercial requiere autorización expresa de la FEDV.
        </p>
        <h2 className="font-display text-xl font-semibold text-slate-900 mt-6 mb-3">
          Exactitud de los datos
        </h2>
        <p className="text-slate-600">
          La FEDV trabaja para mantener la información actualizada. No obstante,
          pueden existir retrasos entre la celebración de torneos y la actualización del ranking.
        </p>
        <h2 className="font-display text-xl font-semibold text-slate-900 mt-6 mb-3">
          Contacto
        </h2>
        <p className="text-slate-600">
          Para consultas, contacta en{' '}
          <a href="mailto:info@fedv.es" className="text-primary-600 hover:text-primary-700">
            info@fedv.es
          </a>
          .
        </p>
      </div>
    </PageContainer>
  )
}

export default TermsPage
