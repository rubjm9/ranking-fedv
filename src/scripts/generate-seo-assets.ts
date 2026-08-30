/**
 * Genera sitemap.xml y HTML prerenderizado tras `vite build`.
 *
 * Fail-open: sin credenciales o con error de Supabase, emite solo rutas estáticas
 * y marca `<!-- seo-assets: PARCIAL -->` en el sitemap.
 *
 * No importar apiService.ts, config/supabase.ts ni ficheros .tsx.
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  buildRegionPageDescription,
  buildRegionPageTitle,
  buildTeamPageDescription,
  buildTeamPageTitle,
  buildTournamentPageDescription,
  buildTournamentPageTitle,
} from '../utils/seoTitles'
import {
  buildBreadcrumbListSchema,
  buildPlaceSchema,
  buildSportsEventSchema,
  buildSportsTeamSchema,
} from '../utils/structuredData'
import { resolveOgImageUrl } from '../utils/socialMeta'
import {
  getRegionPublicUrl,
  getTeamPublicUrl,
  getTournamentPublicUrl,
} from '../utils/publicUrls'
import { DIST_DIR, buildEntityHtmlWithBody, isSafePathSegment, writeEntityHtml } from './seo/html'
import { writeJsonFeeds } from './seo/jsonFeeds'
import { buildSlugMap, writeSlugMap, writeTournamentRedirects } from './seo/entityRedirects'
import {
  buildRegionStaticBody,
  buildTeamStaticBody,
  buildTournamentStaticBody,
} from './seo/staticBodies'
import { writeLlmsTxt } from './seo/llmsTxt'
import { buildStaticSitemapEntries, formatLastmod, resolveBuildDate, writeSitemap } from './seo/sitemap'
import { buildSeoContext, generateStaticPages } from './seo/staticPages'
import { createSeoSupabaseClient, loadSeoData, unwrapRelation } from './seo/supabase'
import type { SitemapEntry } from './seo/types'

const BASE_TEMPLATE = path.join(DIST_DIR, 'index.html')

const main = async () => {
  const siteUrl = resolveSiteUrl()
  const template = await readFile(BASE_TEMPLATE, 'utf8')
  const buildDate = resolveBuildDate()

  let partial = false
  const seenPaths = new Set<string>()
  let entityHtmlCount = 0
  const entries: SitemapEntry[] = buildStaticSitemapEntries(siteUrl, buildDate)

  const supabase = createSeoSupabaseClient()
  if (!supabase) {
    console.warn('⚠️  Faltan VITE_SUPABASE_URL y claves Supabase: sitemap solo con rutas estáticas.')
    partial = true
  } else {
    try {
      const data = await loadSeoData(supabase)
      const staticLastmod = data.entityMaxLastmod ?? buildDate
      const ctx = buildSeoContext(siteUrl, data, staticLastmod)

      for (const entry of entries) {
        entry.lastmod = staticLastmod
      }

      entityHtmlCount += await generateStaticPages(template, ctx, seenPaths)

      for (const team of data.teams) {
        const publicPath = getTeamPublicUrl(team)
        if (publicPath === '/equipos') {
          console.warn(`⚠️  Equipo sin slug ni id utilizable: ${team.name}`)
          continue
        }

        const canonicalUrl = `${siteUrl}${publicPath}`
        const regionName = unwrapRelation(team.region)?.name
        const teamSeo = { name: team.name, location: team.location, regionName }
        const description = buildTeamPageDescription(teamSeo)
        const ranking = data.rankingsByTeamId.get(team.id)

        let staticBody: string | undefined
        try {
          staticBody = buildTeamStaticBody(team, regionName, ranking, siteUrl)
        } catch (error) {
          console.warn(`⚠️  Body estático omitido para equipo ${team.name}:`, error)
        }

        const html = buildEntityHtmlWithBody(template, {
          title: buildTeamPageTitle(teamSeo),
          description,
          canonicalUrl,
          ogImage: resolveOgImageUrl(team, siteUrl),
          jsonLd: [
            buildBreadcrumbListSchema(
              [{ name: 'Equipos', url: '/equipos' }, { name: team.name }],
              siteUrl
            ),
            buildSportsTeamSchema(
              {
                name: team.name,
                slug: team.slug,
                id: team.id,
                location: team.location,
                regionName,
                logo: team.logo,
              },
              siteUrl
            ),
          ],
          staticBody,
        })

        await writeEntityHtml(publicPath.replace(/^\//, ''), html, seenPaths)
        entityHtmlCount++

        entries.push({
          loc: canonicalUrl,
          lastmod: formatLastmod(team.updatedAt),
        })
      }

      for (const region of data.regions) {
        const publicPath = getRegionPublicUrl(region, data.regionSlugById)
        const canonicalUrl = `${siteUrl}${publicPath}`
        const regionSeo = { name: region.name }
        const description = buildRegionPageDescription(regionSeo)
        const regionTeams = data.teamsByRegionId.get(region.id) ?? []

        let staticBody: string | undefined
        try {
          staticBody = buildRegionStaticBody(region, publicPath, regionTeams, siteUrl)
        } catch (error) {
          console.warn(`⚠️  Body estático omitido para región ${region.name}:`, error)
        }

        const html = buildEntityHtmlWithBody(template, {
          title: buildRegionPageTitle(regionSeo),
          description,
          canonicalUrl,
          jsonLd: [
            buildBreadcrumbListSchema(
              [{ name: 'Regiones', url: '/regiones' }, { name: region.name }],
              siteUrl
            ),
            buildPlaceSchema(
              {
                name: region.name,
                slug: region.slug,
                id: region.id,
                description,
                publicPath,
              },
              siteUrl
            ),
          ],
          staticBody,
        })

        await writeEntityHtml(publicPath.replace(/^\//, ''), html, seenPaths)
        entityHtmlCount++

        entries.push({
          loc: canonicalUrl,
          lastmod: formatLastmod(region.updatedAt),
        })
      }

      for (const tournament of data.tournaments) {
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
        const title = buildTournamentPageTitle(tournamentSeo)
        const positions = data.positionsByTournament.get(tournament.id) ?? []

        let staticBody: string | undefined
        try {
          staticBody = buildTournamentStaticBody(tournament, tournamentSeo, positions, siteUrl)
        } catch (error) {
          console.warn(`⚠️  Body estático omitido para campeonato ${tournament.id}:`, error)
        }

        const html = buildEntityHtmlWithBody(template, {
          title,
          description,
          canonicalUrl,
          omitBrandSuffix: true,
          jsonLd: [
            buildBreadcrumbListSchema(
              [{ name: 'Campeonatos', url: '/campeonatos' }, { name: title }],
              siteUrl
            ),
            buildSportsEventSchema(
              {
                id: tournament.id,
                slug: tournament.slug,
                type: tournament.type,
                year: tournament.year,
                surface: tournament.surface,
                category: tournament.category,
                region: unwrapRelation(tournament.region),
                startDate: tournament.startDate,
                endDate: tournament.endDate,
                location: tournament.location,
              },
              siteUrl,
              title,
              positions.map((pos) => {
                const team = unwrapRelation(pos.teams)
                return {
                  position: pos.position,
                  teamName: team?.name ?? `Equipo posición ${pos.position}`,
                  teamSlug: team?.slug,
                  teamId: team?.id,
                  points: pos.points ?? undefined,
                }
              })
            ),
          ],
          staticBody,
        })

        await writeEntityHtml(publicPath.replace(/^\//, ''), html, seenPaths)
        entityHtmlCount++

        entries.push({
          loc: canonicalUrl,
          lastmod: formatLastmod(tournament.updatedAt),
        })
      }

      await writeJsonFeeds(data, ctx, false)
      await writeSlugMap(buildSlugMap(data))
      await writeTournamentRedirects(data.tournaments)

      console.log(
        `SEO: ${entityHtmlCount} HTML, ${entries.length} URLs en sitemap (${data.teams.length} equipos, ${data.regions.length} regiones, ${data.tournaments.length} campeonatos).`
      )
    } catch (error) {
      console.warn('⚠️  Error consultando Supabase; sitemap degradado:', error)
      partial = true
      const ctx = buildSeoContext(siteUrl, {
        teams: [],
        regions: [],
        tournaments: [],
        regionSlugById: new Map(),
        rankingsByTeamId: new Map(),
        positionsByTournament: new Map(),
        teamsByRegionId: new Map(),
        latestSeason: null,
        teamCount: 0,
        tournamentCount: 0,
        entityMaxLastmod: undefined,
      }, buildDate)
      await writeJsonFeeds(
        {
          teams: [],
          regions: [],
          tournaments: [],
          regionSlugById: new Map(),
          rankingsByTeamId: new Map(),
          positionsByTournament: new Map(),
          teamsByRegionId: new Map(),
          latestSeason: null,
          teamCount: 0,
          tournamentCount: 0,
          entityMaxLastmod: undefined,
        },
        ctx,
        true
      )
    }
  }

  await writeSitemap(entries, partial)
  await writeLlmsTxt()
  if (partial) {
    await writeSlugMap({ teams: {}, regions: {}, tournaments: {} })
  }
}

const resolveSiteUrl = (): string => {
  const fromEnv = process.env.VITE_SITE_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return 'https://ranking.fedv.es'
}

main().catch((error) => {
  console.error('generate-seo-assets falló:', error)
  process.exit(1)
})
