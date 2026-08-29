import { describe, it, expect } from 'vitest'
import {
  buildTeamDocumentTitle,
  buildTeamPageDescription,
  buildTeamPageTitle,
  buildTournamentPageDescription,
  buildTournamentPageTitle,
  buildRegionPageTitle,
  buildRegionPageDescription,
  buildRankingPageTitle,
  buildRankingPageDescription,
} from '../seoTitles'

describe('buildTeamPageTitle', () => {
  it('incluye ciudad y keyword Ultimate Frisbee', () => {
    expect(
      buildTeamPageTitle({ name: 'Murciélagos', location: 'Valencia' })
    ).toBe('Murciélagos, Ultimate Frisbee Valencia')
  })

  it('usa la región si no hay ciudad', () => {
    expect(
      buildTeamPageTitle({ name: 'Atis tirma', regionName: 'Comunidad Valenciana' })
    ).toBe('Atis tirma, Ultimate Frisbee Comunidad Valenciana')
  })

  it('añade la marca en el título de documento', () => {
    expect(
      buildTeamDocumentTitle({ name: 'Murciélagos', location: 'Valencia' })
    ).toBe('Murciélagos, Ultimate Frisbee Valencia · Ranking FEDV')
  })
})

describe('buildTeamPageDescription', () => {
  it('menciona Ultimate Frisbee y la ubicación', () => {
    expect(
      buildTeamPageDescription({ name: 'Murciélagos', location: 'Valencia' })
    ).toBe(
      'Resultados, evolución y puntos de Murciélagos en el ranking de Ultimate Frisbee en Valencia.'
    )
  })
})

describe('buildTournamentPageTitle', () => {
  it('expande CE1 con Ultimate y división', () => {
    expect(
      buildTournamentPageTitle({
        type: 'CE1',
        year: 2024,
        surface: 'BEACH',
        category: 'MIXED',
      })
    ).toBe('Campeonato de España Ultimate Playa Mixto, Div 1 2024-25')
  })

  it('expande CE2 con Div 2', () => {
    expect(
      buildTournamentPageTitle({
        type: 'CE2',
        year: 2024,
        surface: 'GRASS',
        category: 'OPEN',
      })
    ).toBe('Campeonato de España Ultimate Césped Open, Div 2 2024-25')
  })

  it('formatea campeonatos regionales', () => {
    expect(
      buildTournamentPageTitle({
        type: 'REGIONAL',
        year: 2024,
        surface: 'BEACH',
        category: 'WOMEN',
        region: { name: 'Cataluña' },
      })
    ).toBe('Campeonato Regional Cataluña Ultimate Playa Women 2024-25')
  })
})

describe('buildTournamentPageDescription', () => {
  it('incluye Ultimate Frisbee y el título largo', () => {
    const tournament = {
      type: 'CE1',
      year: 2024,
      surface: 'BEACH',
      category: 'MIXED',
    }
    expect(buildTournamentPageDescription(tournament)).toBe(
      'Clasificación y puntos de Ultimate Frisbee en Campeonato de España Ultimate Playa Mixto, Div 1 2024-25.'
    )
  })
})

describe('buildRegionPageTitle', () => {
  it('incluye keyword Ultimate Frisbee España', () => {
    expect(buildRegionPageTitle({ name: 'Cataluña' })).toBe('Cataluña, Ultimate Frisbee España')
  })
})

describe('buildRegionPageDescription', () => {
  it('menciona equipos y coeficiente regional', () => {
    expect(buildRegionPageDescription({ name: 'Cataluña' })).toBe(
      'Equipos, campeonatos y coeficiente regional de Cataluña en el ranking de Ultimate Frisbee FEDV.'
    )
  })
})

describe('buildRankingPageTitle', () => {
  it('combina SURFACE_LABELS con Ultimate Frisbee', () => {
    expect(buildRankingPageTitle('general')).toBe('Ranking general de Ultimate Frisbee')
    expect(buildRankingPageTitle('resumen')).toBe('Resumen de Ultimate Frisbee')
  })
})

describe('buildRankingPageDescription', () => {
  it('devuelve descripción específica por superficie', () => {
    expect(buildRankingPageDescription('general')).toContain('Ranking general de Ultimate Frisbee')
    expect(buildRankingPageDescription('beach-mixed')).toContain('playa mixto')
  })
})
