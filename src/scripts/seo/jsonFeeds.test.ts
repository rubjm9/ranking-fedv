import { describe, it, expect } from 'vitest'
import {
  buildIndexFeed,
  buildRankingFeed,
  buildTeamFeed,
  isIso8601,
  resolveFeedDateModified,
} from './jsonFeeds'
import type { LoadedSeoData, SeoBuildContext, TeamRow } from './types'

const SITE = 'https://ranking.fedv.es'
const FALLBACK = '2026-01-15T10:00:00.000Z'

const emptyData = (): LoadedSeoData => ({
  teams: [],
  regions: [],
  tournaments: [],
  regionSlugById: new Map(),
  rankingsByTeamId: new Map(),
  positionsByTournament: new Map(),
  teamsByRegionId: new Map(),
  latestSeason: '2025-26',
  teamCount: 0,
  tournamentCount: 0,
  entityMaxLastmod: FALLBACK,
})

const baseCtx = (overrides: Partial<SeoBuildContext> = {}): SeoBuildContext => ({
  siteUrl: SITE,
  teams: [],
  regions: [],
  tournaments: [],
  regionSlugById: new Map(),
  rankingsByTeamId: new Map(),
  teamById: new Map(),
  latestSeason: '2025-26',
  teamCount: 70,
  tournamentCount: 93,
  staticLastmod: FALLBACK,
  rankingsLastmod: FALLBACK,
  ...overrides,
})

describe('isIso8601', () => {
  it('acepta fechas ISO 8601 en UTC', () => {
    expect(isIso8601('2026-01-15T10:00:00.000Z')).toBe(true)
    expect(isIso8601('2026-01-15T10:00:00Z')).toBe(true)
  })

  it('rechaza formatos no ISO', () => {
    expect(isIso8601('2026-01-15')).toBe(false)
    expect(isIso8601('invalid')).toBe(false)
  })
})

describe('resolveFeedDateModified', () => {
  it('normaliza updatedAt a ISO 8601', () => {
    const result = resolveFeedDateModified('2026-02-01T12:30:00+00:00', FALLBACK)
    expect(isIso8601(result)).toBe(true)
  })

  it('usa fallback si no hay fecha válida', () => {
    expect(resolveFeedDateModified(null, FALLBACK)).toBe(FALLBACK)
  })
})

describe('buildTeamFeed', () => {
  it('incluye campos obligatorios y dateModified ISO', () => {
    const team: TeamRow = {
      id: '1',
      name: 'Atis Tirma',
      slug: 'atis-tirma',
      location: 'Las Palmas',
      regionId: 'r1',
      updatedAt: '2026-01-15T10:00:00Z',
      region: { name: 'Canarias' },
    }

    const feed = buildTeamFeed(team, baseCtx(), FALLBACK)

    expect(feed['@type']).toBe('SportsTeam')
    expect(feed.name).toBe('Atis Tirma')
    expect(feed.url).toBe(`${SITE}/equipos/atis-tirma`)
    expect(feed.sport).toBe('Ultimate Frisbee')
    expect(feed.source).toBe(SITE)
    expect(isIso8601(feed.dateModified as string)).toBe(true)
    expect((feed.memberOf as { name: string }).name).toBe('Canarias')
  })
})

describe('buildRankingFeed', () => {
  it('expone surface, label, season e items', () => {
    const feed = buildRankingFeed(
      'beach-mixed',
      [{ rank: 1, team: 'Atis Tirma', slug: 'atis-tirma', points: 1500 }],
      baseCtx(),
      FALLBACK
    )

    expect(feed.surface).toBe('beach-mixed')
    expect(feed.label).toBe('Playa mixto')
    expect(feed.season).toBe('2025-26')
    expect(isIso8601(feed.dateModified as string)).toBe(true)
    expect(feed.items).toHaveLength(1)
    expect(feed.items).toEqual([
      { rank: 1, team: 'Atis Tirma', slug: 'atis-tirma', points: 1500 },
    ])
  })
})

describe('buildIndexFeed', () => {
  it('marca partial y enlaza al índice de equipos', () => {
    const data = emptyData()
    data.teams = [
      {
        id: '1',
        name: 'Atis Tirma',
        slug: 'atis-tirma',
        location: null,
        updatedAt: null,
        region: null,
      },
    ]

    const feed = buildIndexFeed(data, baseCtx(), FALLBACK, true)
    expect(feed.partial).toBe(true)
    expect(isIso8601(feed.dateModified as string)).toBe(true)
    expect(feed.teams).toEqual([{ slug: 'atis-tirma', url: `${SITE}/data/teams/atis-tirma.json` }])
  })
})
