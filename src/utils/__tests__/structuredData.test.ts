import { describe, it, expect } from 'vitest'
import {
  serializeJsonLd,
  buildBreadcrumbListSchema,
  buildSportsTeamSchema,
  buildSportsEventSchema,
  buildDefinedTermSetSchema,
  buildFaqPageSchema,
  buildPlaceSchema,
} from '../structuredData'
import { GLOSSARY_TERMS } from '../../constants/glossary'

const SITE = 'https://ranking.fedv.es'

describe('serializeJsonLd', () => {
  it('escapa secuencias </script> en el JSON', () => {
    const json = serializeJsonLd({ '@type': 'Thing', name: '</script><script>alert(1)</script>' })
    expect(json).not.toContain('</script>')
    expect(json).toContain('\\u003c/script>')
  })

  it('envuelve arrays en @graph', () => {
    const json = serializeJsonLd([{ '@type': 'Thing', name: 'A' }])
    const parsed = JSON.parse(json)
    expect(parsed['@graph']).toHaveLength(1)
    expect(parsed['@context']).toBe('https://schema.org')
  })
})

describe('buildBreadcrumbListSchema', () => {
  it('incluye Inicio como posición 1', () => {
    const schema = buildBreadcrumbListSchema(
      [{ name: 'Equipos', url: '/equipos' }, { name: 'Atis tirma' }],
      SITE
    )
    const items = schema.itemListElement as Array<Record<string, unknown>>
    expect(items[0]).toMatchObject({ position: 1, name: 'Inicio', item: `${SITE}/` })
    expect(items[1]).toMatchObject({ position: 2, name: 'Equipos', item: `${SITE}/equipos` })
    expect(items[2]).toMatchObject({ position: 3, name: 'Atis tirma' })
    expect(items[2]).not.toHaveProperty('item')
  })
})

describe('buildSportsTeamSchema', () => {
  it('genera SportsTeam con sport Ultimate Frisbee', () => {
    const schema = buildSportsTeamSchema(
      { name: 'Murciélagos', slug: 'murcielagos', location: 'Valencia' },
      SITE
    )
    expect(schema).toMatchObject({
      '@type': 'SportsTeam',
      '@id': `${SITE}/equipos/murcielagos#team`,
      name: 'Murciélagos',
      url: `${SITE}/equipos/murcielagos`,
      sport: 'Ultimate Frisbee',
      location: { '@type': 'Place', name: 'Valencia' },
    })
  })

  it('incluye logo solo si es URL resoluble', () => {
    const withLogo = buildSportsTeamSchema(
      { name: 'Test', slug: 'test', logo: '/logos/test.png' },
      SITE
    )
    expect(withLogo.logo).toBe(`${SITE}/logos/test.png`)

    const withoutLogo = buildSportsTeamSchema({ name: 'Test', slug: 'test', logo: 'relative.png' }, SITE)
    expect(withoutLogo).not.toHaveProperty('logo')
  })
})

describe('buildSportsEventSchema', () => {
  it('referencia al organizador global y fechas', () => {
    const schema = buildSportsEventSchema(
      {
        id: 'abc-123',
        type: 'CE1',
        year: 2024,
        surface: 'BEACH',
        category: 'MIXED',
        startDate: '2024-06-01',
        endDate: '2024-06-02',
        location: 'Valencia',
      },
      SITE,
      'Campeonato de España Ultimate Playa Mixto, Div 1 2024-25'
    )
    expect(schema).toMatchObject({
      '@type': 'SportsEvent',
      '@id': `${SITE}/campeonatos/abc-123#event`,
      sport: 'Ultimate Frisbee',
      startDate: '2024-06-01',
      endDate: '2024-06-02',
      organizer: { '@id': `${SITE}/#organization` },
      location: { '@type': 'Place', name: 'Valencia' },
    })
  })

  it('añade competidores cuando hay resultados', () => {
    const schema = buildSportsEventSchema(
      { id: 't1', type: 'CE1', year: 2024, surface: 'BEACH', category: 'OPEN' },
      SITE,
      'Test event',
      [{ position: 1, teamName: 'Equipo A', teamSlug: 'equipo-a' }]
    )
    expect(schema.competitor).toEqual([
      { '@type': 'SportsTeam', name: 'Equipo A', url: `${SITE}/equipos/equipo-a` },
    ])
  })
})

describe('buildFaqPageSchema', () => {
  it('genera FAQPage con preguntas y respuestas', () => {
    const schema = buildFaqPageSchema([{ question: '¿Qué es CE1?', answer: 'Campeonato de España 1ª división.' }])
    expect(schema['@type']).toBe('FAQPage')
    expect(schema.mainEntity).toEqual([
      {
        '@type': 'Question',
        name: '¿Qué es CE1?',
        acceptedAnswer: { '@type': 'Answer', text: 'Campeonato de España 1ª división.' },
      },
    ])
  })
})

describe('buildDefinedTermSetSchema', () => {
  it('genera DefinedTermSet con 16 términos', () => {
    const schema = buildDefinedTermSetSchema(GLOSSARY_TERMS, SITE)
    expect(schema['@type']).toBe('DefinedTermSet')
    expect(schema.url).toBe(`${SITE}/glosario`)
    expect(schema.hasDefinedTerm).toHaveLength(16)
    expect(schema.hasDefinedTerm[0]).toMatchObject({
      '@type': 'DefinedTerm',
      name: GLOSSARY_TERMS[0].term,
      description: GLOSSARY_TERMS[0].definition,
    })
  })
})

describe('buildPlaceSchema', () => {
  it('genera Place con containedInPlace España', () => {
    const schema = buildPlaceSchema(
      {
        name: 'Comunidad Valenciana',
        publicPath: '/regiones/comunidad-valenciana',
        description: 'Región de Ultimate Frisbee en España.',
      },
      SITE
    )
    expect(schema).toMatchObject({
      '@type': 'Place',
      '@id': `${SITE}/regiones/comunidad-valenciana#place`,
      name: 'Comunidad Valenciana',
      url: `${SITE}/regiones/comunidad-valenciana`,
      containedInPlace: { '@type': 'Country', name: 'España' },
      description: 'Región de Ultimate Frisbee en España.',
    })
  })
})
