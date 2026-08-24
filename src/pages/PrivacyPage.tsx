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
        <p className="text-content-muted">
          La Federación Española de Disco Volador (FEDV) gestiona este sitio con fines
          informativos sobre el ranking oficial de Ultimate Frisbee en España.
        </p>
        <h2 className="font-display text-xl font-semibold text-content mt-6 mb-3">
          Datos que recopilamos
        </h2>
        <p className="text-content-muted">
          El sitio público muestra datos deportivos de equipos, torneos y regiones.
          El acceso al panel de administración requiere autenticación y queda
          restringido al personal autorizado.
        </p>
        <h2 className="font-display text-xl font-semibold text-content mt-6 mb-3">
          Cookies y analítica
        </h2>
        <p className="text-content-muted">
          Este sitio usa Google Analytics 4 para elaborar estadísticas de uso
          de las páginas públicas (por ejemplo, ranking, equipos o torneos).
          La navegación implica la aceptación de estas cookies, que se usan
          únicamente con ese fin. Las rutas del panel de administración no
          se envían a Analytics.
        </p>
        <h2 className="font-display text-xl font-semibold text-content mt-6 mb-3">
          Contacto
        </h2>
        <p className="text-content-muted">
          Para consultas sobre privacidad, contacta en{' '}
          <a href="mailto:info@fedv.es" className="text-link hover:text-brand-strong">
            info@fedv.es
          </a>
          .
        </p>
      </div>
    </PageContainer>
  )
}

export default PrivacyPage
