import { SURFACES } from '../../constants/surfaces'
import { RANKING_SURFACE_DB } from '../../constants/rankingSurfaces'
import {
  buildRankingPageDescription,
  buildRankingPageTitle,
} from '../../utils/seoTitles'
import { GLOSSARY_TERMS } from '../../constants/glossary'
import {
  buildBreadcrumbListSchema,
  buildDefinedTermSetSchema,
  buildFaqPageSchema,
  buildItemListSchema,
  buildWebPageSchema,
} from '../../utils/structuredData'
import {
  buildAboutStaticBody,
  buildFaqItemsForStatic,
  buildGlosarioStaticBody,
  buildHomeStaticBody,
  buildRankingStaticBody,
  buildRegionsListStaticBody,
  buildTeamsListStaticBody,
  buildTournamentsListStaticBody,
  getRankingItems,
} from './staticBodies'
import { buildEntityHtmlWithBody, writeEntityHtml, writeRootHtml } from './html'
import type { LoadedSeoData, SeoBuildContext } from './types'

export type StaticPageConfig = {
  path: string
  title: string
  description: string
  omitBrandSuffix?: boolean
  robots?: string
  jsonLd?: (ctx: SeoBuildContext) => Record<string, unknown>[] | undefined
  buildBody?: (ctx: SeoBuildContext) => string | undefined
}

const HOME_TITLE = 'Ranking FEDV - Ultimate Frisbee España'
const HOME_DESCRIPTION =
  'Ranking oficial de Ultimate Frisbee en España — clasificaciones, equipos y campeonatos de la FEDV.'

const buildRankingJsonLd = (surface: string, ctx: SeoBuildContext): Record<string, unknown>[] => {
  const title = buildRankingPageTitle(surface)
  const description = buildRankingPageDescription(surface)

  if (surface === 'resumen') {
    return [buildWebPageSchema(title, description, `/ranking/${surface}`, ctx.siteUrl)]
  }

  const isAggregate = RANKING_SURFACE_DB[surface] === 'aggregate'
  const limit = isAggregate ? 10 : 20
  const items = getRankingItems(surface, ctx, limit).map((item) => ({
    name: item.team,
    url: `/equipos/${item.slug}`,
    position: item.rank,
  }))

  return [
    buildBreadcrumbListSchema(
      [{ name: 'Ranking', url: '/ranking/resumen' }, { name: title }],
      ctx.siteUrl
    ),
    buildItemListSchema(title, items, ctx.siteUrl),
  ]
}

export const STATIC_PAGE_CONFIG: StaticPageConfig[] = [
  {
    path: '/',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    omitBrandSuffix: true,
    jsonLd: (ctx) => [buildWebPageSchema(HOME_TITLE, HOME_DESCRIPTION, '/', ctx.siteUrl)],
    buildBody: buildHomeStaticBody,
  },
  {
    path: '/equipos',
    title: 'Equipos',
    description:
      'Todos los equipos de ultimate frisbee de España, con su región y su posición en el ranking FEDV.',
    jsonLd: (ctx) => [buildBreadcrumbListSchema([{ name: 'Equipos' }], ctx.siteUrl)],
    buildBody: buildTeamsListStaticBody,
  },
  {
    path: '/regiones',
    title: 'Regiones',
    description: 'Las regiones del ranking FEDV y el coeficiente regional de cada una.',
    jsonLd: (ctx) => [buildBreadcrumbListSchema([{ name: 'Regiones' }], ctx.siteUrl)],
    buildBody: buildRegionsListStaticBody,
  },
  {
    path: '/campeonatos',
    title: 'Campeonatos',
    description: 'Calendario y resultados de los campeonatos de ultimate frisbee disputados en España.',
    jsonLd: (ctx) => [buildBreadcrumbListSchema([{ name: 'Campeonatos' }], ctx.siteUrl)],
    buildBody: buildTournamentsListStaticBody,
  },
  {
    path: '/como-funciona',
    title: 'Cómo funciona',
    description:
      'Cómo se calcula el ranking FEDV: puntos por puesto, coeficiente regional y ponderación por temporada.',
    jsonLd: () => [buildFaqPageSchema(buildFaqItemsForStatic())],
    buildBody: (ctx) => buildAboutStaticBody(ctx.siteUrl),
  },
  {
    path: '/glosario',
    title: 'Glosario',
    description:
      'Glosario de términos del ranking de Ultimate Frisbee en España: CE1, CE2, coeficiente regional, modalidades y más.',
    jsonLd: (ctx) => [buildDefinedTermSetSchema(GLOSSARY_TERMS, ctx.siteUrl)],
    buildBody: () => buildGlosarioStaticBody(),
  },
  {
    path: '/privacy',
    title: 'Privacidad',
    description: 'Política de privacidad del ranking FEDV: tratamiento de datos, cookies y contacto.',
  },
  {
    path: '/terms',
    title: 'Términos',
    description: 'Términos de uso del ranking oficial de Ultimate Frisbee de la FEDV.',
  },
  {
    path: '/disc-golf',
    title: 'Disc golf',
    description: 'Disc golf en España, dentro de la Federación Española de Disco Volador.',
    robots: 'noindex,nofollow',
  },
  ...SURFACES.map((surface) => ({
    path: `/ranking/${surface}`,
    title: buildRankingPageTitle(surface),
    description: buildRankingPageDescription(surface),
    jsonLd: (ctx: SeoBuildContext) => buildRankingJsonLd(surface, ctx),
    buildBody: (ctx: SeoBuildContext) => buildRankingStaticBody(surface, buildRankingPageTitle(surface), ctx),
  })),
]

export const buildSeoContext = (siteUrl: string, data: LoadedSeoData, staticLastmod: string): SeoBuildContext => ({
  siteUrl,
  teams: data.teams,
  regions: data.regions,
  tournaments: data.tournaments,
  regionSlugById: data.regionSlugById,
  rankingsByTeamId: data.rankingsByTeamId,
  teamById: new Map(data.teams.map((team) => [team.id, team])),
  latestSeason: data.latestSeason,
  teamCount: data.teamCount,
  tournamentCount: data.tournamentCount,
  staticLastmod,
  rankingsLastmod: staticLastmod,
})

export const generateStaticPages = async (
  template: string,
  ctx: SeoBuildContext,
  seenPaths: Set<string>
): Promise<number> => {
  let count = 0

  for (const page of STATIC_PAGE_CONFIG) {
    const canonicalUrl = page.path === '/' ? `${ctx.siteUrl}/` : `${ctx.siteUrl}${page.path}`
    const html = buildEntityHtmlWithBody(template, {
      title: page.title,
      description: page.description,
      canonicalUrl,
      omitBrandSuffix: page.omitBrandSuffix,
      robots: page.robots,
      jsonLd: page.jsonLd?.(ctx),
      staticBody: page.buildBody?.(ctx),
    })

    if (page.path === '/') {
      await writeRootHtml(html)
    } else {
      const relativeDir = page.path.replace(/^\//, '')
      await writeEntityHtml(relativeDir, html, seenPaths)
    }
    count++
  }

  return count
}
