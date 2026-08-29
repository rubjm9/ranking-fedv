import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getTournamentPublicUrl } from '../../utils/publicUrls'
import { DIST_DIR } from './html'
import type { TournamentRow } from './types'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
  console.log(`Redirects: ${lines.length} reglas UUID→slug en dist/_redirects`)
  return lines.length
}
