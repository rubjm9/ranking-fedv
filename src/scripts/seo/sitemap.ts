import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { SURFACES } from '../../constants/surfaces'
import { DIST_DIR, escapeXml } from './html'
import type { SitemapEntry } from './types'

export const STATIC_PATHS = [
  '/',
  '/equipos',
  '/regiones',
  '/campeonatos',
  '/como-funciona',
  '/glosario',
  '/disc-golf',
  '/privacy',
  '/terms',
  ...SURFACES.map((s) => `/ranking/${s}`),
]

export const formatLastmod = (updatedAt: string | null | undefined): string | undefined => {
  if (!updatedAt) return undefined
  const date = new Date(updatedAt)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

export const resolveBuildDate = (): string => {
  const fromEnv = process.env.BUILD_DATE || process.env.VERCEL_GIT_COMMIT_TIMESTAMP
  if (fromEnv) {
    const parsed = new Date(fromEnv)
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  }
  return new Date().toISOString()
}

export const buildSitemapXml = (entries: SitemapEntry[], partial: boolean): string => {
  const urls = entries
    .map(({ loc, lastmod }) => {
      const lastmodTag = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : ''
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodTag}\n  </url>`
    })
    .join('\n')

  const partialMarker = partial ? '\n<!-- seo-assets: PARCIAL -->' : ''
  return `<?xml version="1.0" encoding="UTF-8"?>${partialMarker}\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export const buildStaticSitemapEntries = (siteUrl: string, lastmod: string): SitemapEntry[] =>
  STATIC_PATHS.map((p) => ({
    loc: p === '/' ? `${siteUrl}/` : `${siteUrl}${p}`,
    lastmod,
  }))

export const writeSitemap = async (
  entries: SitemapEntry[],
  partial: boolean,
  distDir = DIST_DIR
): Promise<void> => {
  const sitemapPath = path.join(distDir, 'sitemap.xml')
  await writeFile(sitemapPath, buildSitemapXml(entries, partial), 'utf8')
  console.log(`Sitemap escrito en ${sitemapPath}${partial ? ' (PARCIAL)' : ''}.`)
}
