export interface BreadcrumbSchemaItem {
  name: string
  url?: string
}

export interface SportsTeamSource {
  name: string
  slug?: string | null
  id?: string
  location?: string | null
  regionName?: string | null
  logo?: string | null
}

export interface SportsEventSource {
  id: string
  slug?: string | null
  type: string
  year: number
  surface: string
  category: string
  region?: { name: string } | null
  startDate?: string | null
  endDate?: string | null
  location?: string | null
}

export interface SportsEventResult {
  position: number
  teamName: string
  teamSlug?: string | null
  teamId?: string
  points?: number
}

export interface FaqItem {
  question: string
  answer: string
}

export interface PlaceSource {
  name: string
  slug?: string | null
  id?: string
  description?: string
  publicPath: string
}

const SCHEMA_CONTEXT = 'https://schema.org'

/** Serializa JSON-LD seguro para insertar en `<script type="application/ld+json">`. */
export function serializeJsonLd(data: Record<string, unknown> | Record<string, unknown>[]): string {
  const payload = Array.isArray(data)
    ? { '@context': SCHEMA_CONTEXT, '@graph': data }
    : { '@context': SCHEMA_CONTEXT, ...data }

  return JSON.stringify(payload).replace(/<\//g, '\\u003c/')
}

const resolveAbsoluteUrl = (siteUrl: string, pathOrUrl: string): string => {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${siteUrl.replace(/\/$/, '')}${path}`
}

const resolveLogoUrl = (logo: string | null | undefined, siteUrl: string): string | undefined => {
  if (!logo?.trim()) return undefined
  if (logo.startsWith('http://') || logo.startsWith('https://')) return logo
  if (logo.startsWith('/')) return `${siteUrl.replace(/\/$/, '')}${logo}`
  return undefined
}

const resolveTeamPath = (team: SportsTeamSource): string => {
  if (team.slug) return `/equipos/${team.slug}`
  if (team.id) return `/equipos/${team.id}`
  return '/equipos'
}

export function buildBreadcrumbListSchema(
  items: BreadcrumbSchemaItem[],
  siteUrl: string
): Record<string, unknown> {
  const base = siteUrl.replace(/\/$/, '')
  const listItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Inicio',
      item: `${base}/`,
    },
    ...items.map((item, index) => {
      const entry: Record<string, unknown> = {
        '@type': 'ListItem',
        position: index + 2,
        name: item.name,
      }
      if (item.url) {
        entry.item = resolveAbsoluteUrl(base, item.url)
      }
      return entry
    }),
  ]

  return {
    '@type': 'BreadcrumbList',
    itemListElement: listItems,
  }
}

export function buildSportsTeamSchema(team: SportsTeamSource, siteUrl: string): Record<string, unknown> {
  const base = siteUrl.replace(/\/$/, '')
  const teamPath = resolveTeamPath(team)
  const schema: Record<string, unknown> = {
    '@type': 'SportsTeam',
    '@id': `${base}${teamPath}#team`,
    name: team.name,
    url: `${base}${teamPath}`,
    sport: 'Ultimate Frisbee',
  }

  const place = team.location?.trim() || team.regionName?.trim()
  if (place) {
    schema.location = {
      '@type': 'Place',
      name: place,
    }
  }

  const logo = resolveLogoUrl(team.logo, base)
  if (logo) schema.logo = logo

  return schema
}

export function buildSportsEventSchema(
  tournament: SportsEventSource,
  siteUrl: string,
  title: string,
  results?: SportsEventResult[]
): Record<string, unknown> {
  const base = siteUrl.replace(/\/$/, '')
  const eventSegment = tournament.slug || tournament.id
  const eventPath = `/campeonatos/${encodeURIComponent(eventSegment)}`
  const schema: Record<string, unknown> = {
    '@type': 'SportsEvent',
    '@id': `${base}${eventPath}#event`,
    name: title,
    url: `${base}${eventPath}`,
    sport: 'Ultimate Frisbee',
    organizer: { '@id': `${base}/#organization` },
  }

  if (tournament.startDate) schema.startDate = tournament.startDate
  if (tournament.endDate) schema.endDate = tournament.endDate

  const locationName = tournament.location?.trim()
  if (locationName) {
    schema.location = {
      '@type': 'Place',
      name: locationName,
    }
  }

  if (results && results.length > 0) {
    schema.competitor = results.map((result) => {
      const competitor: Record<string, unknown> = {
        '@type': 'SportsTeam',
        name: result.teamName,
      }
      if (result.teamSlug) {
        competitor.url = `${base}/equipos/${result.teamSlug}`
      } else if (result.teamId) {
        competitor.url = `${base}/equipos/${result.teamId}`
      }
      return competitor
    })
  }

  return schema
}

export function buildFaqPageSchema(faqs: FaqItem[]): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function buildPlaceSchema(place: PlaceSource, siteUrl: string): Record<string, unknown> {
  const base = siteUrl.replace(/\/$/, '')
  const regionPath = place.publicPath.startsWith('/') ? place.publicPath : `/${place.publicPath}`
  const schema: Record<string, unknown> = {
    '@type': 'Place',
    '@id': `${base}${regionPath}#place`,
    name: place.name,
    url: `${base}${regionPath}`,
    containedInPlace: {
      '@type': 'Country',
      name: 'España',
    },
  }

  if (place.description) schema.description = place.description

  return schema
}

export interface ItemListEntry {
  name: string
  url?: string
  position: number
}

export function buildWebPageSchema(
  name: string,
  description: string,
  path: string,
  siteUrl?: string
): Record<string, unknown> {
  const base = siteUrl?.replace(/\/$/, '') ?? ''
  const pagePath = path.startsWith('/') ? path : `/${path}`
  const schema: Record<string, unknown> = {
    '@type': 'WebPage',
    name,
    description,
  }
  if (base) schema.url = `${base}${pagePath}`
  return schema
}

export function buildDefinedTermSetSchema(
  terms: Array<{ term: string; definition: string }>,
  siteUrl: string
): Record<string, unknown> {
  const base = siteUrl.replace(/\/$/, '')
  return {
    '@type': 'DefinedTermSet',
    name: 'Glosario de Ultimate Frisbee — Ranking FEDV',
    url: `${base}/glosario`,
    hasDefinedTerm: terms.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.term,
      description: t.definition,
    })),
  }
}

export function buildItemListSchema(
  name: string,
  items: ItemListEntry[],
  siteUrl: string
): Record<string, unknown> {
  const base = siteUrl.replace(/\/$/, '')
  return {
    '@type': 'ItemList',
    name,
    itemListElement: items.map((item) => {
      const entry: Record<string, unknown> = {
        '@type': 'ListItem',
        position: item.position,
        name: item.name,
      }
      if (item.url) entry.url = resolveAbsoluteUrl(base, item.url)
      return entry
    }),
  }
}
