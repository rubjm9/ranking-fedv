/**
 * Genera sitemap.xml y HTML prerenderizado por entidad tras `vite build`.
 *
 * Fail-open: sin credenciales o con error de Supabase, emite solo rutas estáticas
 * y marca `<!-- seo-assets: PARCIAL -->` en el sitemap.
 *
 * No importar apiService.ts, config/supabase.ts ni ficheros .tsx.
 */

import { createClient } from '@supabase/supabase-js'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SURFACES } from '../constants/surfaces'
import {
  buildRegionPublicSlugById,
  getRegionPublicUrl,
  getTeamPublicUrl,
  getTournamentPublicUrl,
} from '../utils/publicUrls'
import {
  buildTeamPageDescription,
  buildTeamPageTitle,
  buildTournamentPageDescription,
  buildTournamentPageTitle,
} from '../utils/seoTitles'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, '../../dist')
const BASE_TEMPLATE = path.join(DIST_DIR, 'index.html')

const STATIC_PATHS = [
  '/',
  '/equipos',
  '/regiones',
  '/campeonatos',
  '/como-funciona',
  '/disc-golf',
  '/privacy',
  '/terms',
  ...SURFACES.map((s) => `/ranking/${s}`),
]

type SitemapEntry = { loc: string; lastmod?: string }

type TeamRow = {
  id: string
  name: string
  slug: string | null
  location: string | null
  updatedAt: string | null
  region: { name: string } | { name: string }[] | null
}
type RegionRow = { id: string; name: string; slug: string | null; createdAt: string | null; updatedAt: string | null }
type TournamentRow = {
  id: string
  name: string
  type: string
  year: number
  surface: string
  category: string
  updatedAt: string | null
  region: { name: string } | { name: string }[] | null
}

const unwrapRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

const escapeXml = (text: string): string =>
  text.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      case "'":
        return '&apos;'
      default:
        return ch
    }
  })

const escapeHtmlAttr = escapeXml

const hasControlChars = (id: string): boolean => {
  for (let i = 0; i < id.length; i++) {
    const code = id.charCodeAt(i)
    if (code <= 0x1f || code === 0x7f) return true
  }
  return false
}

const isSafePathSegment = (id: string): boolean => {
  if (!id || id.includes('/') || id.includes('\\') || id.includes('..')) return false
  if (hasControlChars(id)) return false
  return true
}

const resolveSiteUrl = (): string => {
  const fromEnv = process.env.VITE_SITE_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return 'https://ranking.fedv.es'
}

const formatLastmod = (updatedAt: string | null | undefined): string | undefined => {
  if (!updatedAt) return undefined
  const date = new Date(updatedAt)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

const buildSitemapXml = (entries: SitemapEntry[], partial: boolean): string => {
  const urls = entries
    .map(({ loc, lastmod }) => {
      const lastmodTag = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : ''
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodTag}\n  </url>`
    })
    .join('\n')

  const partialMarker = partial ? '\n<!-- seo-assets: PARCIAL -->' : ''
  return `<?xml version="1.0" encoding="UTF-8"?>${partialMarker}\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

const replaceMetaContent = (html: string, pattern: RegExp, newContent: string): string =>
  html.replace(pattern, (_match, prefix: string, suffix: string) => `${prefix}${escapeHtmlAttr(newContent)}${suffix}`)

const buildEntityHtml = (
  template: string,
  {
    title,
    description,
    canonicalUrl,
    omitBrandSuffix = false,
  }: { title: string; description: string; canonicalUrl: string; omitBrandSuffix?: boolean }
): string => {
  const fullTitle = omitBrandSuffix ? title : `${title} · Ranking FEDV`
  let html = template

  html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtmlAttr(fullTitle)}</title>`)

  html = replaceMetaContent(
    html,
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    description
  )

  html = replaceMetaContent(
    html,
    /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
    fullTitle
  )

  html = replaceMetaContent(
    html,
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
    description
  )

  html = replaceMetaContent(
    html,
    /(<meta\s+property="og:url"\s+content=")[^"]*(")/,
    canonicalUrl
  )

  html = replaceMetaContent(
    html,
    /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/,
    fullTitle
  )

  html = replaceMetaContent(
    html,
    /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/,
    description
  )

  html = html.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
    (_match, prefix: string, suffix: string) => `${prefix}${escapeHtmlAttr(canonicalUrl)}${suffix}`
  )

  return html
}

const writeEntityHtml = async (relativePath: string, html: string, seenPaths: Set<string>) => {
  const normalizedKey = relativePath.toLowerCase()
  if (seenPaths.has(normalizedKey)) {
    console.warn(`⚠️  Colisión de ruta (case-insensitive): ${relativePath}`)
    return
  }
  seenPaths.add(normalizedKey)

  const filePath = path.join(DIST_DIR, relativePath, 'index.html')
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, html, 'utf8')
}

const main = async () => {
  const siteUrl = resolveSiteUrl()
  const template = await readFile(BASE_TEMPLATE, 'utf8')
  const entries: SitemapEntry[] = STATIC_PATHS.map((p) => ({
    loc: p === '/' ? `${siteUrl}/` : `${siteUrl}${p}`,
  }))

  let partial = false
  const seenPaths = new Set<string>()
  let entityHtmlCount = 0

  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn('⚠️  Faltan VITE_SUPABASE_URL y claves Supabase: sitemap solo con rutas estáticas.')
    partial = true
  } else {
    try {
      const supabase = createClient(url, key)

      const [teamsResult, regionsResult, tournamentsResult] = await Promise.all([
        supabase.from('teams').select('id, name, slug, location, updatedAt, region:regions(name)'),
        supabase.from('regions').select('id, name, createdAt, updatedAt'),
        supabase
          .from('tournaments')
          .select('id, name, type, year, surface, category, updatedAt, region:regions(name)'),
      ])

      if (teamsResult.error) throw teamsResult.error
      if (regionsResult.error) throw regionsResult.error
      if (tournamentsResult.error) throw tournamentsResult.error

      const teams = (teamsResult.data ?? []) as TeamRow[]
      const regions = (regionsResult.data ?? []) as RegionRow[]
      const tournaments = (tournamentsResult.data ?? []) as TournamentRow[]

      if (regions.length !== 5) {
        console.warn(`⚠️  Se esperaban 5 regiones, se obtuvieron ${regions.length}. Revisar datos.`)
      }

      const regionSlugById = buildRegionPublicSlugById(regions)

      for (const team of teams) {
        const publicPath = getTeamPublicUrl(team)
        if (publicPath === '/equipos') {
          console.warn(`⚠️  Equipo sin slug ni id utilizable: ${team.name}`)
          continue
        }

        const canonicalUrl = `${siteUrl}${publicPath}`
        const regionName = unwrapRelation(team.region)?.name
        const teamSeo = { name: team.name, location: team.location, regionName }
        const description = buildTeamPageDescription(teamSeo)
        const html = buildEntityHtml(template, {
          title: buildTeamPageTitle(teamSeo),
          description,
          canonicalUrl,
        })

        const relativeDir = publicPath.replace(/^\//, '')
        await writeEntityHtml(relativeDir, html, seenPaths)
        entityHtmlCount++

        entries.push({
          loc: canonicalUrl,
          lastmod: formatLastmod(team.updatedAt),
        })
      }

      for (const region of regions) {
        const publicPath = getRegionPublicUrl(region, regionSlugById)
        const canonicalUrl = `${siteUrl}${publicPath}`
        const description = `Equipos, campeonatos y coeficiente regional de ${region.name} en el ranking FEDV.`
        const html = buildEntityHtml(template, {
          title: region.name,
          description,
          canonicalUrl,
        })

        const relativeDir = publicPath.replace(/^\//, '')
        await writeEntityHtml(relativeDir, html, seenPaths)
        entityHtmlCount++

        entries.push({
          loc: canonicalUrl,
          lastmod: formatLastmod(region.updatedAt),
        })
      }

      for (const tournament of tournaments) {
        if (!isSafePathSegment(tournament.id)) {
          console.warn(`⚠️  Id de campeonato no seguro, omitido: ${JSON.stringify(tournament.id)}`)
          continue
        }

        const publicPath = getTournamentPublicUrl(tournament)
        const canonicalUrl = `${siteUrl}${publicPath}`
        const tournamentSeo = {
          type: tournament.type,
          year: tournament.year,
          surface: tournament.surface,
          category: tournament.category,
          region: unwrapRelation(tournament.region),
        }
        const description = buildTournamentPageDescription(tournamentSeo)
        const html = buildEntityHtml(template, {
          title: buildTournamentPageTitle(tournamentSeo),
          description,
          canonicalUrl,
          omitBrandSuffix: true,
        })

        const relativeDir = publicPath.replace(/^\//, '')
        await writeEntityHtml(relativeDir, html, seenPaths)
        entityHtmlCount++

        entries.push({
          loc: `${siteUrl}/campeonatos/${encodeURIComponent(tournament.id)}`,
          lastmod: formatLastmod(tournament.updatedAt),
        })
      }

      console.log(
        `SEO: ${entityHtmlCount} HTML de entidad, ${entries.length} URLs en sitemap (${teams.length} equipos, ${regions.length} regiones, ${tournaments.length} campeonatos).`
      )
    } catch (error) {
      console.warn('⚠️  Error consultando Supabase; sitemap degradado:', error)
      partial = true
    }
  }

  const sitemapPath = path.join(DIST_DIR, 'sitemap.xml')
  await writeFile(sitemapPath, buildSitemapXml(entries, partial), 'utf8')
  console.log(`Sitemap escrito en ${sitemapPath}${partial ? ' (PARCIAL)' : ''}.`)
}

main().catch((error) => {
  console.error('generate-seo-assets falló:', error)
  process.exit(1)
})
