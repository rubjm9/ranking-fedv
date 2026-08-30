const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type SlugMap = {
  teams: Record<string, string>
  regions: Record<string, string>
  tournaments: Record<string, string>
}

const EMPTY_MAP: SlugMap = { teams: {}, regions: {}, tournaments: {} }

let slugMapCache: SlugMap | null = null

async function loadSlugMap(request: Request): Promise<SlugMap> {
  if (slugMapCache) return slugMapCache
  try {
    const response = await fetch(new URL('/slug-map.json', request.url), { cache: 'force-cache' })
    if (response.ok) {
      slugMapCache = (await response.json()) as SlugMap
      return slugMapCache
    }
  } catch {
    // Sin mapa estático: no redirigir.
  }
  return EMPTY_MAP
}

function lookupSlug(section: string, segment: string, map: SlugMap): string | undefined {
  switch (section) {
    case 'equipos':
      return map.teams[segment]
    case 'regiones':
      return map.regions[segment]
    case 'campeonatos':
      return map.tournaments[segment]
    default:
      return undefined
  }
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url)
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length !== 2) return

  const [section, segment] = parts
  if (!UUID_RE.test(segment)) return

  const map = await loadSlugMap(request)
  const slug = lookupSlug(section, segment, map)
  if (!slug) return

  url.pathname = `/${section}/${slug}`
  return Response.redirect(url.toString(), 301)
}

export const config = {
  matcher: ['/equipos/:segment', '/regiones/:segment', '/campeonatos/:segment'],
}
