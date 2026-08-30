import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { SURFACES, SURFACE_LABELS } from '../../constants/surfaces'
import { getRegionPublicUrl, getTeamPublicUrl, getTournamentPublicUrl } from '../../utils/publicUrls'
import { buildRegionPageDescription } from '../../utils/seoTitles'
import { DIST_DIR } from './html'
import { getRankingItems } from './staticBodies'
import type { LoadedSeoData, RankingListItem, RegionRow, SeoBuildContext, TeamRow, TournamentRow } from './types'

const ISO_8601_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/

export const isIso8601 = (value: string): boolean => ISO_8601_RE.test(value)

export const resolveFeedDateModified = (updatedAt: string | null | undefined, fallback: string): string =>
  updatedAt && !Number.isNaN(new Date(updatedAt).getTime())
    ? new Date(updatedAt).toISOString()
    : fallback

export const buildTeamFeed = (
  team: TeamRow,
  ctx: SeoBuildContext,
  dateModified: string
): Record<string, unknown> => {
  const regionName = Array.isArray(team.region) ? team.region[0]?.name : team.region?.name
  const ranking = ctx.rankingsByTeamId.get(team.id)
  const publicPath = getTeamPublicUrl(team)

  const rankings: Record<string, { rank: number; points: number; season: string }> = {}
  if (ranking) {
    const modalities = [
      ['beach_mixed', ranking.beach_mixed_rank, ranking.beach_mixed_points],
      ['beach_open', ranking.beach_open_rank, ranking.beach_open_points],
      ['beach_women', ranking.beach_women_rank, ranking.beach_women_points],
      ['grass_mixed', ranking.grass_mixed_rank, ranking.grass_mixed_points],
      ['grass_open', ranking.grass_open_rank, ranking.grass_open_points],
      ['grass_women', ranking.grass_women_rank, ranking.grass_women_points],
      ['global', ranking.global_rank, ranking.global_points],
    ] as const

    for (const [key, rank, points] of modalities) {
      if (rank != null) {
        rankings[key] = { rank, points: Number(points ?? 0), season: ranking.season }
      }
    }
  }

  const feed: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: team.name,
    url: `${ctx.siteUrl}${publicPath}`,
    sport: 'Ultimate Frisbee',
    dateModified,
    source: ctx.siteUrl,
  }

  const place = team.location?.trim() || regionName
  if (place) feed.location = { '@type': 'Place', name: place }
  if (regionName) feed.memberOf = { '@type': 'SportsOrganization', name: regionName }
  if (Object.keys(rankings).length > 0) feed.rankings = rankings

  return feed
}

export const buildRegionFeed = (
  region: RegionRow,
  ctx: SeoBuildContext,
  dateModified: string
): Record<string, unknown> => {
  const publicPath = getRegionPublicUrl(region, ctx.regionSlugById)
  const description = buildRegionPageDescription({ name: region.name })
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: region.name,
    url: `${ctx.siteUrl}${publicPath}`,
    description,
    containedInPlace: { '@type': 'Country', name: 'España' },
    dateModified,
    source: ctx.siteUrl,
  }
}

export const buildTournamentFeed = (
  tournament: TournamentRow,
  ctx: SeoBuildContext,
  dateModified: string
): Record<string, unknown> => {
  const publicPath = getTournamentPublicUrl(tournament)
  const region = Array.isArray(tournament.region) ? tournament.region[0] : tournament.region
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: tournament.name,
    url: `${ctx.siteUrl}${publicPath}`,
    sport: 'Ultimate Frisbee',
    startDate: tournament.startDate ?? undefined,
    endDate: tournament.endDate ?? undefined,
    location: tournament.location ? { '@type': 'Place', name: tournament.location } : undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    organizer: { '@type': 'SportsOrganization', name: 'FEDV' },
    about: {
      type: tournament.type,
      year: tournament.year,
      surface: tournament.surface,
      category: tournament.category,
      region: region?.name,
    },
    dateModified,
    source: ctx.siteUrl,
  }
}

export const buildRankingFeed = (
  surface: string,
  items: RankingListItem[],
  ctx: SeoBuildContext,
  dateModified: string
): Record<string, unknown> => ({
  surface,
  label: SURFACE_LABELS[surface] ?? surface,
  season: ctx.latestSeason,
  dateModified,
  source: ctx.siteUrl,
  items: items.map((item) => ({
    rank: item.rank,
    team: item.team,
    slug: item.slug,
    points: item.points,
  })),
})

export const buildIndexFeed = (
  data: LoadedSeoData,
  ctx: SeoBuildContext,
  dateModified: string,
  partial = false
): Record<string, unknown> => ({
  name: 'Ranking FEDV data catalog',
  description: 'Índice de feeds JSON públicos del ranking de Ultimate Frisbee en España.',
  dateModified,
  source: ctx.siteUrl,
  partial,
  teams: data.teams.map((t) => {
    const key = t.slug || t.id
    return { slug: key, url: `${ctx.siteUrl}/data/teams/${key}.json` }
  }),
  regions: data.regions.map((r) => {
    const slug = getRegionPublicUrl(r, ctx.regionSlugById).replace('/regiones/', '')
    return { slug, url: `${ctx.siteUrl}/data/regions/${slug}.json` }
  }),
  tournaments: data.tournaments.map((t) => {
    const key = t.slug || t.id
    return { slug: key, url: `${ctx.siteUrl}/data/tournaments/${key}.json` }
  }),
  rankings: SURFACES.map((surface) => ({
    surface,
    url: `${ctx.siteUrl}/data/ranking/${surface}.json`,
  })),
})

const writeJson = async (relativePath: string, payload: Record<string, unknown>, distDir = DIST_DIR) => {
  const filePath = path.join(distDir, relativePath)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

export const writeJsonFeeds = async (
  data: LoadedSeoData,
  ctx: SeoBuildContext,
  partial = false,
  distDir = DIST_DIR
): Promise<number> => {
  const fallbackDate = ctx.staticLastmod
  let count = 0

  const indexFeed = buildIndexFeed(data, ctx, fallbackDate, partial)
  await writeJson('data/index.json', indexFeed, distDir)
  count++

  if (partial) {
    console.warn('⚠️  Modo PARCIAL: solo se generó data/index.json')
    return count
  }

  for (const team of data.teams) {
    const key = team.slug || team.id
    const dateModified = resolveFeedDateModified(team.updatedAt, fallbackDate)
    await writeJson(`data/teams/${key}.json`, buildTeamFeed(team, ctx, dateModified), distDir)
    count++
  }

  for (const region of data.regions) {
    const slug = getRegionPublicUrl(region, ctx.regionSlugById).replace('/regiones/', '')
    const dateModified = resolveFeedDateModified(region.updatedAt, fallbackDate)
    await writeJson(`data/regions/${slug}.json`, buildRegionFeed(region, ctx, dateModified), distDir)
    count++
  }

  for (const tournament of data.tournaments) {
    const key = tournament.slug || tournament.id
    const dateModified = resolveFeedDateModified(tournament.updatedAt, fallbackDate)
    await writeJson(
      `data/tournaments/${key}.json`,
      buildTournamentFeed(tournament, ctx, dateModified),
      distDir
    )
    count++
  }

  for (const surface of SURFACES) {
    const items = getRankingItems(surface, ctx, 50)
    await writeJson(
      `data/ranking/${surface}.json`,
      buildRankingFeed(surface, items, ctx, ctx.rankingsLastmod),
      distDir
    )
    count++
  }

  console.log(`JSON feeds: ${count} ficheros en dist/data/`)
  return count
}
