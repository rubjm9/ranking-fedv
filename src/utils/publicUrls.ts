import { generateSlug, generateUniqueSlug } from '@/utils/slug'

export type RegionSlugSource = {
  id: string
  name: string
  slug?: string | null
  createdAt?: string
}

function assignSlugInBatch(name: string, usedSlugs: Set<string>, previousSlug?: string | null): string {
  if (previousSlug) usedSlugs.delete(previousSlug)
  const slug = generateUniqueSlug(name, usedSlugs)
  usedSlugs.add(slug)
  return slug
}

export function getTeamPublicUrl(team: { slug?: string | null; id?: string }): string {
  if (team.slug) return `/equipos/${team.slug}`
  if (team.id) return `/equipos/${team.id}`
  return '/equipos'
}

/**
 * Las URL públicas de campeonato usan slug cuando está disponible; si no, id (UUID).
 */
export function getTournamentPublicUrl(tournament: { slug?: string | null; id?: string }): string {
  if (tournament.slug) return `/campeonatos/${tournament.slug}`
  if (tournament.id) return `/campeonatos/${tournament.id}`
  return '/campeonatos'
}

export function buildRegionPublicSlugById(regions: RegionSlugSource[]): Map<string, string> {
  const usedSlugs = new Set<string>()
  const byId = new Map<string, string>()
  const sorted = [...regions].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))

  for (const region of sorted) {
    const publicSlug = region.slug || assignSlugInBatch(region.name, usedSlugs)
    byId.set(region.id, publicSlug)
  }

  return byId
}

export function getRegionPublicUrl(
  region: { slug?: string | null; id?: string; name?: string },
  slugById?: Map<string, string>
): string {
  if (region.id && slugById?.has(region.id)) {
    return `/regiones/${slugById.get(region.id)}`
  }
  if (region.slug) return `/regiones/${region.slug}`
  if (region.name) {
    const fromName = generateSlug(region.name)
    if (fromName) return `/regiones/${fromName}`
  }
  if (region.id) return `/regiones/${region.id}`
  return '/regiones'
}
