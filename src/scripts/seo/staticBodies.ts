import { SURFACES, SURFACE_LABELS } from '../../constants/surfaces'
import {
  AGGREGATE_SURFACE_REPRESENTATIVE,
  RANKING_SURFACE_DB,
  type TeamSeasonRankingRow,
} from '../../constants/rankingSurfaces'
import { ABOUT_FAQ_ITEMS } from '../../constants/aboutFaq'
import { GLOSSARY_TERMS } from '../../constants/glossary'
import {
  getRegionPublicUrl,
  getTeamPublicUrl,
  getTournamentPublicUrl,
} from '../../utils/publicUrls'
import {
  buildTournamentPageTitle,
} from '../../utils/seoTitles'
import { escapeHtml, escapeHtmlAttr } from './html'
import type {
  PositionRow,
  RankingListItem,
  RegionRow,
  RegionTeamRow,
  SeoBuildContext,
  TeamRow,
  TournamentRow,
} from './types'

const MODALITY_ROWS = [
  { label: 'General', rankKey: 'global_rank', pointsKey: 'global_points' },
  { label: 'Playa mixto', rankKey: 'beach_mixed_rank', pointsKey: 'beach_mixed_points' },
  { label: 'Playa open', rankKey: 'beach_open_rank', pointsKey: 'beach_open_points' },
  { label: 'Playa women', rankKey: 'beach_women_rank', pointsKey: 'beach_women_points' },
  { label: 'Césped mixto', rankKey: 'grass_mixed_rank', pointsKey: 'grass_mixed_points' },
  { label: 'Césped open', rankKey: 'grass_open_rank', pointsKey: 'grass_open_points' },
  { label: 'Césped women', rankKey: 'grass_women_rank', pointsKey: 'grass_women_points' },
] as const

export const getRankingItems = (
  surface: string,
  ctx: SeoBuildContext,
  limit: number
): RankingListItem[] => {
  const mapping = RANKING_SURFACE_DB[surface]
  if (!mapping || mapping === 'aggregate') {
    const representative = AGGREGATE_SURFACE_REPRESENTATIVE[surface]
    if (!representative) return []
    return sortRankingByKeys(representative.rankKey, representative.pointsKey, ctx, limit)
  }
  return sortRankingByKeys(mapping.rankKey, mapping.pointsKey, ctx, limit)
}

const sortRankingByKeys = (
  rankKey: keyof TeamSeasonRankingRow,
  pointsKey: keyof TeamSeasonRankingRow,
  ctx: SeoBuildContext,
  limit: number
): RankingListItem[] => {
  const items: RankingListItem[] = []
  for (const [teamId, ranking] of ctx.rankingsByTeamId.entries()) {
    const rank = ranking[rankKey]
    if (rank == null || typeof rank !== 'number') continue
    const team = ctx.teamById.get(teamId)
    if (!team) continue
    const points = Number(ranking[pointsKey] ?? 0)
    items.push({
      rank,
      team: team.name,
      slug: team.slug || team.id,
      points,
    })
  }
  return items
    .sort((a, b) => a.rank - b.rank || b.points - a.points || a.team.localeCompare(b.team, 'es'))
    .slice(0, limit)
}

const buildRankingTableBody = (title: string, items: RankingListItem[], siteUrl: string): string => {
  const lines = [`<h1>${escapeHtml(title)}</h1>`]
  if (items.length === 0) {
    lines.push('<p>Clasificación no disponible en este momento.</p>')
    return lines.join('\n')
  }
  lines.push('<table><thead><tr><th>Posición</th><th>Equipo</th><th>Puntos</th></tr></thead><tbody>')
  for (const item of items) {
    const teamPath = `/equipos/${item.slug}`
    lines.push(
      `<tr><td>${escapeHtml(String(item.rank))}</td><td><a href="${escapeHtmlAttr(`${siteUrl}${teamPath}`)}">${escapeHtml(item.team)}</a></td><td>${escapeHtml(String(item.points))}</td></tr>`
    )
  }
  lines.push('</tbody></table>')
  return lines.join('\n')
}

export const buildTeamStaticBody = (
  team: TeamRow,
  regionName: string | undefined,
  ranking: TeamSeasonRankingRow | undefined,
  siteUrl: string
): string => {
  const publicPath = getTeamPublicUrl(team)
  const place = team.location?.trim() || regionName || 'España'
  const lines = [
    `<h1>${escapeHtml(team.name)}</h1>`,
    `<p>${escapeHtml(team.name)} es un equipo de Ultimate Frisbee en ${escapeHtml(place)}.${regionName ? ` Región: ${escapeHtml(regionName)}.` : ''}</p>`,
  ]

  if (ranking) {
    const rows = MODALITY_ROWS.map(({ label, rankKey, pointsKey }) => {
      const rank = ranking[rankKey as keyof TeamSeasonRankingRow]
      const points = ranking[pointsKey as keyof TeamSeasonRankingRow]
      if (rank == null) return ''
      return `<tr><td>${escapeHtml(label)}</td><td>#${escapeHtml(String(rank))}</td><td>${escapeHtml(String(points ?? 0))}</td></tr>`
    }).filter(Boolean)

    if (rows.length > 0) {
      lines.push(`<h2>Posiciones temporada ${escapeHtml(ranking.season)}</h2>`)
      lines.push(
        '<table><thead><tr><th>Modalidad</th><th>Posición</th><th>Puntos</th></tr></thead><tbody>',
        ...rows,
        '</tbody></table>'
      )
    }
  }

  lines.push(`<p><a href="${escapeHtmlAttr(`${siteUrl}${publicPath}`)}">Ver ficha completa de ${escapeHtml(team.name)}</a></p>`)
  return lines.join('\n')
}

export const buildTournamentStaticBody = (
  tournament: TournamentRow,
  tournamentSeo: Parameters<typeof buildTournamentPageTitle>[0],
  positions: PositionRow[],
  siteUrl: string
): string => {
  const title = buildTournamentPageTitle(tournamentSeo)
  const publicPath = getTournamentPublicUrl(tournament)
  const lines = [`<h1>${escapeHtml(title)}</h1>`]

  const meta: string[] = []
  if (tournament.location?.trim()) meta.push(`Lugar: ${escapeHtml(tournament.location.trim())}`)
  if (tournament.startDate) meta.push(`Inicio: ${escapeHtml(tournament.startDate)}`)
  if (tournament.endDate) meta.push(`Fin: ${escapeHtml(tournament.endDate)}`)
  if (meta.length > 0) lines.push(`<p>${meta.join(' · ')}</p>`)

  const top = positions.slice(0, 15)
  if (top.length > 0) {
    lines.push('<h2>Clasificación</h2>')
    lines.push('<table><thead><tr><th>Puesto</th><th>Equipo</th><th>Puntos</th></tr></thead><tbody>')
    for (const pos of top) {
      const team = Array.isArray(pos.teams) ? pos.teams[0] : pos.teams
      const teamPath = team?.slug ? `/equipos/${team.slug}` : team?.id ? `/equipos/${team.id}` : null
      const teamCell = teamPath
        ? `<a href="${escapeHtmlAttr(`${siteUrl}${teamPath}`)}">${escapeHtml(team?.name ?? 'Equipo')}</a>`
        : escapeHtml(team?.name ?? 'Equipo')
      lines.push(
        `<tr><td>${escapeHtml(String(pos.position))}</td><td>${teamCell}</td><td>${escapeHtml(String(pos.points ?? 0))}</td></tr>`
      )
    }
    lines.push('</tbody></table>')
  }

  lines.push(`<p><a href="${escapeHtmlAttr(`${siteUrl}${publicPath}`)}">Ver campeonato completo</a></p>`)
  return lines.join('\n')
}

export const buildRegionStaticBody = (
  region: RegionRow,
  publicPath: string,
  teams: Array<RegionTeamRow & { points: number }>,
  siteUrl: string
): string => {
  const lines = [
    `<h1>${escapeHtml(region.name)}</h1>`,
    `<p>Equipos, campeonatos y coeficiente regional de ${escapeHtml(region.name)} en el ranking de Ultimate Frisbee FEDV.</p>`,
  ]

  if (teams.length > 0) {
    lines.push('<h2>Equipos destacados</h2><ul>')
    for (const team of teams.slice(0, 10)) {
      const teamPath = getTeamPublicUrl(team)
      lines.push(
        `<li><a href="${escapeHtmlAttr(`${siteUrl}${teamPath}`)}">${escapeHtml(team.name)}</a>${team.points > 0 ? ` — ${escapeHtml(String(team.points))} pts` : ''}</li>`
      )
    }
    lines.push('</ul>')
  }

  lines.push(`<p><a href="${escapeHtmlAttr(`${siteUrl}${publicPath}`)}">Ver región completa</a></p>`)
  return lines.join('\n')
}

export const buildHomeStaticBody = (ctx: SeoBuildContext): string => {
  const season = ctx.latestSeason ? ` Temporada ${escapeHtml(ctx.latestSeason)}.` : ''
  const links = [
    `<a href="${escapeHtmlAttr(`${ctx.siteUrl}/ranking/general`)}">Ranking general</a>`,
    `<a href="${escapeHtmlAttr(`${ctx.siteUrl}/equipos`)}">Equipos</a>`,
    `<a href="${escapeHtmlAttr(`${ctx.siteUrl}/campeonatos`)}">Campeonatos</a>`,
  ].join(' · ')
  return [
    '<h1>Ranking FEDV — Ultimate Frisbee España</h1>',
    `<p>Ranking oficial de Ultimate Frisbee en España con ${escapeHtml(String(ctx.teamCount))} equipos y ${escapeHtml(String(ctx.tournamentCount))} campeonatos registrados.${season}</p>`,
    `<p>${links}</p>`,
  ].join('\n')
}

export const buildTeamsListStaticBody = (ctx: SeoBuildContext): string => {
  const sorted = [...ctx.teams].sort((a, b) => a.name.localeCompare(b.name, 'es'))
  const lines = [
    '<h1>Equipos de Ultimate Frisbee en España</h1>',
    '<table><thead><tr><th>Equipo</th><th>Región</th></tr></thead><tbody>',
  ]
  for (const team of sorted) {
    const regionName = Array.isArray(team.region) ? team.region[0]?.name : team.region?.name
    const teamPath = getTeamPublicUrl(team)
    lines.push(
      `<tr><td><a href="${escapeHtmlAttr(`${ctx.siteUrl}${teamPath}`)}">${escapeHtml(team.name)}</a></td><td>${escapeHtml(regionName ?? '—')}</td></tr>`
    )
  }
  lines.push('</tbody></table>')
  return lines.join('\n')
}

export const buildRegionsListStaticBody = (ctx: SeoBuildContext): string => {
  const lines = ['<h1>Regiones del ranking FEDV</h1>', '<ul>']
  for (const region of [...ctx.regions].sort((a, b) => a.name.localeCompare(b.name, 'es'))) {
    const regionPath = getRegionPublicUrl(region, ctx.regionSlugById)
    lines.push(`<li><a href="${escapeHtmlAttr(`${ctx.siteUrl}${regionPath}`)}">${escapeHtml(region.name)}</a></li>`)
  }
  lines.push('</ul>')
  return lines.join('\n')
}

export const buildTournamentsListStaticBody = (ctx: SeoBuildContext): string => {
  const recent = [...ctx.tournaments]
    .sort((a, b) => b.year - a.year || (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    .slice(0, 30)

  const lines = [
    '<h1>Campeonatos de Ultimate Frisbee en España</h1>',
    '<table><thead><tr><th>Año</th><th>Campeonato</th><th>Tipo</th></tr></thead><tbody>',
  ]
  for (const tournament of recent) {
    const region = Array.isArray(tournament.region) ? tournament.region[0] : tournament.region
    const seo = {
      type: tournament.type,
      year: tournament.year,
      surface: tournament.surface,
      category: tournament.category,
      region,
    }
    const title = buildTournamentPageTitle(seo)
    const publicPath = getTournamentPublicUrl(tournament)
    lines.push(
      `<tr><td>${escapeHtml(String(tournament.year))}</td><td><a href="${escapeHtmlAttr(`${ctx.siteUrl}${publicPath}`)}">${escapeHtml(title)}</a></td><td>${escapeHtml(tournament.type)}</td></tr>`
    )
  }
  lines.push('</tbody></table>')
  return lines.join('\n')
}

export const buildAboutStaticBody = (siteUrl: string): string => {
  const faqLines = ABOUT_FAQ_ITEMS.flatMap(({ question, answer }) => [
    `<dt>${escapeHtml(question)}</dt>`,
    `<dd>${escapeHtml(answer)}</dd>`,
  ])

  return [
    '<h1>Cómo funciona el ranking FEDV</h1>',
    '<p>El ranking oficial de Ultimate Frisbee en España suma puntos por puesto en campeonatos CE1, CE2 y regionales, con coeficiente regional y ponderación por temporada.</p>',
    `<p><a href="${escapeHtmlAttr(`${siteUrl}/como-funciona`)}">Ver explicación completa</a></p>`,
    '<h2>Preguntas frecuentes</h2>',
    '<dl>',
    ...faqLines,
    '</dl>',
  ].join('\n')
}

export const buildGlosarioStaticBody = (): string => {
  const lines = ['<h1>Glosario de Ultimate Frisbee</h1>', '<dl>']
  for (const { term, definition } of GLOSSARY_TERMS) {
    lines.push(`<dt>${escapeHtml(term)}</dt><dd>${escapeHtml(definition)}</dd>`)
  }
  lines.push('</dl>')
  return lines.join('\n')
}

export const buildRankingStaticBody = (surface: string, title: string, ctx: SeoBuildContext): string | undefined => {
  if (surface === 'resumen') {
    const links = SURFACES.filter((s) => s !== 'resumen')
      .map((s) => {
        const label = SURFACE_LABELS[s] ?? s
        return `<a href="${escapeHtmlAttr(`${ctx.siteUrl}/ranking/${s}`)}">${escapeHtml(label)}</a>`
      })
      .join(' · ')
    return [
      `<h1>${escapeHtml(title)}</h1>`,
      '<p>Resumen del ranking de Ultimate Frisbee en España: clasificación general, modalidades y evolución de equipos.</p>',
      `<p>${links}</p>`,
    ].join('\n')
  }

  const isAggregate = RANKING_SURFACE_DB[surface] === 'aggregate'
  const limit = isAggregate ? 10 : 20
  const items = getRankingItems(surface, ctx, limit)
  return buildRankingTableBody(title, items, ctx.siteUrl)
}

export const buildFaqItemsForStatic = () => ABOUT_FAQ_ITEMS
