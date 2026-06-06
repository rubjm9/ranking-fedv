import React from 'react'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'

const PrivacyPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Política de privacidad"
        subtitle="Información sobre el tratamiento de datos en el sistema de ranking FEDV."
      />
      <div className="card prose prose-slate max-w-none">
        <p className="text-slate-600">
          La Federación Española de Disco Volador (FEDV) gestiona este sitio con fines
          informativos sobre el ranking oficial de Ultimate Frisbee en España.
        </p>
        <h2 className="font-display text-xl font-semibold text-slate-900 mt-6 mb-3">
          Datos que recopilamos
        </h2>
        <p className="text-slate-600">
          El sitio público muestra datos deportivos de equipos, torneos y regiones.
          El acceso al panel de administración requiere autenticación y queda
          restringido al personal autorizado.
        </p>
        <h2 className="font-display text-xl font-semibold text-slate-900 mt-6 mb-3">
          Contacto
        </h2>
        <p className="text-slate-600">
          Para consultas sobre privacidad, contacta en{' '}
          <a href="mailto:info@fedv.es" className="text-primary-600 hover:text-primary-700">
            info@fedv.es
          </a>
          .
        </p>
      </div>
    </PageContainer>
  )
}

export default PrivacyPage
