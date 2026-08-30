import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getRegionPublicUrl, getTeamPublicUrl, getTournamentPublicUrl } from '../../utils/publicUrls'
import { DIST_DIR } from './html'
import type { LoadedSeoData, TournamentRow } from './types'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type SlugMap = {
  teams: Record<string, string>
  regions: Record<string, string>
  tournaments: Record<string, string>
}

const segmentFromPath = (publicPath: string): string | null => {
  const parts = publicPath.split('/').filter(Boolean)
  return parts.length === 2 ? parts[1] : null
}

const addEntry = (map: Record<string, string>, id: string, slug: string | null | undefined): void => {
  if (!slug || !UUID_RE.test(id) || slug === id) return
  map[id] = slug
}

/** Mapa UUID→slug para middleware Vercel y tests. Solo entradas con slug distinto del id. */
export const buildSlugMap = (data: LoadedSeoData): SlugMap => {
  const map: SlugMap = { teams: {}, regions: {}, tournaments: {} }

  for (const team of data.teams) {
    const slug = segmentFromPath(getTeamPublicUrl(team))
    addEntry(map.teams, team.id, slug)
  }

  for (const region of data.regions) {
    const slug = segmentFromPath(getRegionPublicUrl(region, data.regionSlugById))
    addEntry(map.regions, region.id, slug)
  }

  for (const tournament of data.tournaments) {
    const slug = segmentFromPath(getTournamentPublicUrl(tournament))
    addEntry(map.tournaments, tournament.id, slug)
  }

  return map
}

export const writeSlugMap = async (map: SlugMap, distDir = DIST_DIR): Promise<void> => {
  const target = path.join(distDir, 'slug-map.json')
  await writeFile(target, `${JSON.stringify(map)}\n`, 'utf8')
  const total = Object.keys(map.teams).length + Object.keys(map.regions).length + Object.keys(map.tournaments).length
  console.log(`slug-map.json: ${total} redirecciones UUID→slug en ${target}`)
}

export const buildTournamentRedirectLines = (tournaments: TournamentRow[]): string[] => {
  const lines: string[] = []
  for (const tournament of tournaments) {
    if (!tournament.slug || !UUID_RE.test(tournament.id)) continue
    const slugPath = getTournamentPublicUrl(tournament)
    lines.push(`/campeonatos/${tournament.id}  ${slugPath}  301`)
  }
  return lines
}

export const writeTournamentRedirects = async (
  tournaments: TournamentRow[],
  distDir = DIST_DIR
): Promise<number> => {
  const lines = buildTournamentRedirectLines(tournaments)
  if (lines.length === 0) return 0

  const content = `${lines.join('\n')}\n`
  await writeFile(path.join(distDir, '_redirects'), content, 'utf8')
  console.log(`Redirects: ${lines.length} reglas UUID→slug en dist/_redirects (legacy Netlify)`)
  return lines.length
}
