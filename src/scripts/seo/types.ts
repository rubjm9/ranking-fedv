import type { TeamSeasonRankingRow } from '../../constants/rankingSurfaces'

export type { TeamSeasonRankingRow }

export type SitemapEntry = { loc: string; lastmod?: string }

export type TeamRow = {
  id: string
  name: string
  slug: string | null
  location: string | null
  logo?: string | null
  regionId?: string | null
  updatedAt: string | null
  region: { name: string } | { name: string }[] | null
}

export type RegionRow = {
  id: string
  name: string
  slug: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type TournamentRow = {
  id: string
  name: string
  slug: string | null
  type: string
  year: number
  surface: string
  category: string
  startDate?: string | null
  endDate?: string | null
  location?: string | null
  updatedAt: string | null
  region: { name: string } | { name: string }[] | null
}

export type PositionRow = {
  tournamentId: string
  position: number
  points: number | null
  teams: { name: string; slug: string | null; id?: string } | { name: string; slug: string | null; id?: string }[] | null
}

export type RegionTeamRow = {
  id: string
  name: string
  slug: string | null
  regionId: string | null
}

export type RankingListItem = {
  rank: number
  team: string
  slug: string
  points: number
}

export type SeoBuildContext = {
  siteUrl: string
  teams: TeamRow[]
  regions: RegionRow[]
  tournaments: TournamentRow[]
  regionSlugById: Map<string, string>
  rankingsByTeamId: Map<string, TeamSeasonRankingRow>
  teamById: Map<string, TeamRow>
  latestSeason: string | null
  teamCount: number
  tournamentCount: number
  staticLastmod: string
  rankingsLastmod: string
}

export type LoadedSeoData = {
  teams: TeamRow[]
  regions: RegionRow[]
  tournaments: TournamentRow[]
  regionSlugById: Map<string, string>
  rankingsByTeamId: Map<string, TeamSeasonRankingRow>
  positionsByTournament: Map<string, PositionRow[]>
  teamsByRegionId: Map<string, Array<RegionTeamRow & { points: number }>>
  latestSeason: string | null
  teamCount: number
  tournamentCount: number
  entityMaxLastmod: string | undefined
}
