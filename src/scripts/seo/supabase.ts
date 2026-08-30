import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { buildRegionPublicSlugById } from '../../utils/publicUrls'
import { isMissingColumnError } from '../../utils/supabaseErrors'
import type {
  LoadedSeoData,
  PositionRow,
  RegionTeamRow,
  RegionRow,
  TeamRow,
  TeamSeasonRankingRow,
  TournamentRow,
} from './types'

const unwrapRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export const createSeoSupabaseClient = (): SupabaseClient | null => {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

const loadLatestSeasonRankings = async (
  supabase: SupabaseClient
): Promise<{ byTeamId: Map<string, TeamSeasonRankingRow>; latestSeason: string | null }> => {
  const byTeamId = new Map<string, TeamSeasonRankingRow>()
  try {
    const { data: seasons, error: seasonError } = await supabase
      .from('team_season_rankings')
      .select('season')
      .order('season', { ascending: false })
      .limit(1)

    if (seasonError) throw seasonError
    const latestSeason = seasons?.[0]?.season ?? null
    if (!latestSeason) return { byTeamId, latestSeason }

    const { data: rankings, error } = await supabase
      .from('team_season_rankings')
      .select(
        'team_id, season, global_rank, global_points, beach_mixed_rank, beach_mixed_points, beach_open_rank, beach_open_points, beach_women_rank, beach_women_points, grass_mixed_rank, grass_mixed_points, grass_open_rank, grass_open_points, grass_women_rank, grass_women_points'
      )
      .eq('season', latestSeason)

    if (error) throw error
    for (const row of (rankings ?? []) as TeamSeasonRankingRow[]) {
      byTeamId.set(row.team_id, row)
    }
    return { byTeamId, latestSeason }
  } catch (error) {
    console.warn('⚠️  No se pudieron cargar team_season_rankings para SEO estático:', error)
    return { byTeamId, latestSeason: null }
  }
}

const loadPositionsByTournament = async (supabase: SupabaseClient): Promise<Map<string, PositionRow[]>> => {
  const byTournament = new Map<string, PositionRow[]>()
  try {
    const { data: positions, error } = await supabase
      .from('positions')
      .select('tournamentId, position, points, teams(name, slug, id)')
      .order('position', { ascending: true })

    if (error) throw error
    for (const row of (positions ?? []) as PositionRow[]) {
      const list = byTournament.get(row.tournamentId) ?? []
      if (list.length < 15) list.push(row)
      byTournament.set(row.tournamentId, list)
    }
  } catch (error) {
    console.warn('⚠️  No se pudieron cargar positions para SEO estático:', error)
  }
  return byTournament
}

const loadRegionTeams = async (
  supabase: SupabaseClient,
  rankingsByTeamId: Map<string, TeamSeasonRankingRow>
): Promise<Map<string, Array<RegionTeamRow & { points: number }>>> => {
  const byRegion = new Map<string, Array<RegionTeamRow & { points: number }>>()
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('id, name, slug, regionId')
      .not('regionId', 'is', null)

    if (error) throw error
    for (const team of (teams ?? []) as RegionTeamRow[]) {
      if (!team.regionId) continue
      const points = Number(rankingsByTeamId.get(team.id)?.global_points ?? 0)
      const list = byRegion.get(team.regionId) ?? []
      list.push({ ...team, points })
      byRegion.set(team.regionId, list)
    }

    for (const [regionId, list] of byRegion.entries()) {
      list.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'es'))
      byRegion.set(regionId, list)
    }
  } catch (error) {
    console.warn('⚠️  No se pudieron cargar equipos por región para SEO estático:', error)
  }
  return byRegion
}

const REGION_SELECT_WITH_SLUG = 'id, name, slug, createdAt, updatedAt'

const REGION_SELECT_WITHOUT_SLUG = 'id, name, createdAt, updatedAt'

const TOURNAMENT_SELECT_WITH_SLUG =
  'id, name, slug, type, year, surface, category, startDate, endDate, location, updatedAt, region:regions(name)'

const TOURNAMENT_SELECT_WITHOUT_SLUG =
  'id, name, type, year, surface, category, startDate, endDate, location, updatedAt, region:regions(name)'

const maxLastmod = (...values: Array<string | null | undefined>): string | undefined => {
  let best: string | undefined
  for (const value of values) {
    if (!value) continue
    const time = new Date(value).getTime()
    if (Number.isNaN(time)) continue
    if (!best || time > new Date(best).getTime()) best = new Date(value).toISOString()
  }
  return best
}

export const loadSeoData = async (supabase: SupabaseClient): Promise<LoadedSeoData> => {
  const [teamsResult, regionsResult, tournamentsResult, teamCountResult, tournamentCountResult] =
    await Promise.all([
      supabase.from('teams').select('id, name, slug, location, logo, regionId, updatedAt, region:regions(name)'),
      supabase.from('regions').select(REGION_SELECT_WITH_SLUG),
      supabase.from('tournaments').select(TOURNAMENT_SELECT_WITH_SLUG),
      supabase.from('teams').select('id', { count: 'exact', head: true }),
      supabase.from('tournaments').select('id', { count: 'exact', head: true }),
    ])

  if (teamsResult.error) throw teamsResult.error

  let regionsResultFinal = regionsResult
  if (regionsResult.error && isMissingColumnError(regionsResult.error, 'slug')) {
    console.warn('⚠️  Columna regions.slug ausente (migración 018 pendiente); SEO con slugs derivados del nombre.')
    regionsResultFinal = await supabase.from('regions').select(REGION_SELECT_WITHOUT_SLUG)
  }
  if (regionsResultFinal.error) throw regionsResultFinal.error

  let tournamentsResultFinal = tournamentsResult
  if (tournamentsResult.error && isMissingColumnError(tournamentsResult.error, 'slug')) {
    console.warn('⚠️  Columna tournaments.slug ausente (migración 019 pendiente); SEO sin slugs de campeonato.')
    tournamentsResultFinal = await supabase.from('tournaments').select(TOURNAMENT_SELECT_WITHOUT_SLUG)
  }
  if (tournamentsResultFinal.error) throw tournamentsResultFinal.error

  const teams = (teamsResult.data ?? []) as TeamRow[]
  const regions = ((regionsResultFinal.data ?? []) as Omit<RegionRow, 'slug'>[]).map((region) => ({
    ...region,
    slug: 'slug' in region ? (region as RegionRow).slug : null,
  })) as RegionRow[]
  const tournaments = (tournamentsResultFinal.data ?? []) as TournamentRow[]

  if (regions.length !== 5) {
    console.warn(`⚠️  Se esperaban 5 regiones, se obtuvieron ${regions.length}. Revisar datos.`)
  }

  const regionSlugById = buildRegionPublicSlugById(regions)
  const { byTeamId: rankingsByTeamId, latestSeason } = await loadLatestSeasonRankings(supabase)
  const positionsByTournament = await loadPositionsByTournament(supabase)
  const teamsByRegionId = await loadRegionTeams(supabase, rankingsByTeamId)

  const entityMaxLastmod = maxLastmod(
    ...teams.map((t) => t.updatedAt),
    ...regions.map((r) => r.updatedAt),
    ...tournaments.map((t) => t.updatedAt)
  )

  return {
    teams,
    regions,
    tournaments,
    regionSlugById,
    rankingsByTeamId,
    positionsByTournament,
    teamsByRegionId,
    latestSeason,
    teamCount: teamCountResult.count ?? teams.length,
    tournamentCount: tournamentCountResult.count ?? tournaments.length,
    entityMaxLastmod,
  }
}

export { unwrapRelation }
