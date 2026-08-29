import React from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import { usePageMeta } from '@/hooks/usePageMeta'

interface GlossaryEntry {
  term: string
  definition: React.ReactNode
}

const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    term: 'CE1',
    definition: (
      <>
        Campeonato de España de 1ª división. Los equipos suman puntos directos de la curva nacional según el
        puesto obtenido.{' '}
        <Link to="/como-funciona" className="text-link hover:text-brand-strong">
          Más información
        </Link>
      </>
    ),
  },
  {
    term: 'CE2',
    definition: (
      <>
        Campeonato de España de 2ª división (ascenso). Usa la misma escala que CE1, pero el campeón recibe
        los puntos del puesto posterior al último equipo de 1ª.{' '}
        <Link to="/como-funciona" className="text-link hover:text-brand-strong">
          Más información
        </Link>
      </>
    ),
  },
  {
    term: 'Campeonato regional',
    definition:
      'Campeonato autonómico oficial. El campeón parte de 100 puntos base, multiplicados por el coeficiente regional del equipo.',
  },
  {
    term: 'Coeficiente regional',
    definition: (
      <>
        Factor entre 0.80 y 1.20 que refleja la fortaleza relativa de cada región en el ámbito nacional.
        Se calcula con resultados CE1/CE2 y se aplica a los regionales de la temporada siguiente.{' '}
        <Link to="/como-funciona#coeficiente-regional" className="text-link hover:text-brand-strong">
          Ver fórmula
        </Link>
      </>
    ),
  },
  {
    term: 'Ultimate Frisbee',
    definition:
      'Deporte de equipo con disco volador. En España, la FEDV organiza campeonatos oficiales en playa y césped.',
  },
  {
    term: 'FEDV',
    definition:
      'Federación Española de Disco Volador. Organismo que gestiona el ranking oficial de Ultimate Frisbee en España.',
  },
  {
    term: 'Modalidad Open',
    definition: 'Categoría masculina/open en campeonatos de Ultimate Frisbee.',
  },
  {
    term: 'Modalidad Women',
    definition: 'Categoría femenina en campeonatos de Ultimate Frisbee.',
  },
  {
    term: 'Modalidad Mixed',
    definition: 'Categoría mixta (equipos con jugadores y jugadoras) en campeonatos de Ultimate Frisbee.',
  },
  {
    term: 'Playa',
    definition: 'Superficie de juego en arena. Hay rankings independientes para open, women y mixed en playa.',
  },
  {
    term: 'Césped',
    definition: 'Superficie de juego en campo de hierba. Hay rankings independientes para open, women y mixed en césped.',
  },
  {
    term: 'Temporada',
    definition:
      'Periodo deportivo que agrupa campeonatos oficiales. El ranking actual pondera las cuatro temporadas más recientes.',
  },
  {
    term: 'Puntos por puesto',
    definition: (
      <>
        Cada posición en un campeonato otorga una cantidad de puntos según la curva nacional o regional.{' '}
        <Link to="/como-funciona" className="text-link hover:text-brand-strong">
          Ver escala de puntos
        </Link>
      </>
    ),
  },
  {
    term: 'Ranking general',
    definition:
      'Clasificación que agrega el rendimiento de los equipos sumando puntos de todas las modalidades con ponderación temporal.',
  },
  {
    term: 'División 1',
    definition: 'Primera división del campeonato de España (CE1). Reparte los puntos más altos de la curva nacional.',
  },
  {
    term: 'División 2',
    definition: 'Segunda división del campeonato de España (CE2). Los puntos siguen la curva nacional con offset según el tamaño de la 1ª asociada.',
  },
]

const GlosarioPage: React.FC = () => {
  usePageMeta({
    title: 'Glosario',
    description:
      'Glosario de términos del ranking de Ultimate Frisbee en España: CE1, CE2, coeficiente regional, modalidades y más.',
  })

  return (
    <PageContainer>
      <PageHeader
        title="Glosario de Ultimate Frisbee"
        subtitle="Definiciones de términos del ranking FEDV para equipos, campeonatos y modalidades."
      />

      <div className="card">
        <dl className="space-y-6">
          {GLOSSARY_ENTRIES.map(({ term, definition }) => (
            <div key={term}>
              <dt className="text-lg font-semibold text-content">{term}</dt>
              <dd className="mt-1 text-content-muted text-sm leading-relaxed">{definition}</dd>
            </div>
          ))}
        </dl>
      </div>
    </PageContainer>
  )
}

export default GlosarioPage
