import React from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import JsonLd from '@/components/seo/JsonLd'
import { GLOSSARY_TERMS } from '@/constants/glossary'
import { usePageMeta } from '@/hooks/usePageMeta'
import { buildDefinedTermSetSchema } from '@/utils/structuredData'

const SITE_URL = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') ?? 'https://ranking.fedv.es'

const GlosarioPage: React.FC = () => {
  usePageMeta({
    title: 'Glosario',
    description:
      'Glosario de términos del ranking de Ultimate Frisbee en España: CE1, CE2, coeficiente regional, modalidades y más.',
  })

  return (
    <PageContainer>
      <JsonLd data={buildDefinedTermSetSchema(GLOSSARY_TERMS, SITE_URL)} />
      <PageHeader
        title="Glosario de Ultimate Frisbee"
        subtitle="Definiciones de términos del ranking FEDV para equipos, campeonatos y modalidades."
      />

      <div className="card">
        <dl className="space-y-6">
          {GLOSSARY_TERMS.map(({ term, definition, link }) => (
            <div key={term}>
              <dt className="text-lg font-semibold text-content">{term}</dt>
              <dd className="mt-1 text-content-muted text-sm leading-relaxed">
                {definition}
                {link && (
                  <>
                    {' '}
                    <Link to={link.to} className="text-link hover:text-brand-strong">
                      {link.label}
                    </Link>
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </PageContainer>
  )
}

export default GlosarioPage
