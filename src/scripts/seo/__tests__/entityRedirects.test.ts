import { describe, it, expect } from 'vitest'
import { buildSlugMap } from '../entityRedirects'
import type { LoadedSeoData } from '../types'

const TEAM_UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const REGION_UUID = '11111111-2222-3333-4444-555555555555'
const TOURNAMENT_UUID = '99999999-8888-7777-6666-555555555555'

const baseData = (): LoadedSeoData => ({
  teams: [
    {
      id: TEAM_UUID,
      name: 'Atis Tirma',
      slug: 'atis-tirma',
      location: null,
      updatedAt: null,
      region: null,
    },
    {
      id: 'atis-tirma',
      name: 'Slug como id',
      slug: 'atis-tirma',
      location: null,
      updatedAt: null,
      region: null,
    },
  ],
  regions: [
    {
      id: REGION_UUID,
      name: 'Canarias',
      slug: 'canarias',
      createdAt: null,
      updatedAt: null,
    },
  ],
  tournaments: [
    {
      id: TOURNAMENT_UUID,
      name: 'CE1 2025',
      slug: 'ce1-2025-playa-mixto',
      type: 'NACIONAL',
      year: 2025,
      surface: 'beach',
      category: 'mixed',
      updatedAt: null,
      region: null,
    },
  ],
  regionSlugById: new Map([[REGION_UUID, 'canarias']]),
  rankingsByTeamId: new Map(),
  positionsByTournament: new Map(),
  teamsByRegionId: new Map(),
  latestSeason: null,
  teamCount: 2,
  tournamentCount: 1,
  entityMaxLastmod: undefined,
})

describe('buildSlugMap', () => {
  it('mapea UUID conocido al slug canónico', () => {
    const map = buildSlugMap(baseData())
    expect(map.teams[TEAM_UUID]).toBe('atis-tirma')
    expect(map.regions[REGION_UUID]).toBe('canarias')
    expect(map.tournaments[TOURNAMENT_UUID]).toBe('ce1-2025-playa-mixto')
  })

  it('no incluye slugs canónicos que ya coinciden con el segmento de URL', () => {
    const map = buildSlugMap(baseData())
    expect(map.teams['atis-tirma']).toBeUndefined()
  })
})
