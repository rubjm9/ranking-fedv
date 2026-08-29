import { formatSeasonFromYear } from '@/utils/rankingCalculations'
import { translateModality, translateSurface } from '@/utils/translations'

const BRAND_SUFFIX = 'Ranking FEDV'

export interface TeamSeoSource {
  name: string
  location?: string | null
  regionName?: string | null
}

export interface TournamentSeoSource {
  type: string
  year: number
  surface: string
  category: string
  region?: { name: string } | null
}

/** Parte del título antes del sufijo «· Ranking FEDV». */
export function buildTeamPageTitle({ name, location, regionName }: TeamSeoSource): string {
  const place = location?.trim() || regionName?.trim() || 'España'
  return `${name}, Ultimate Frisbee ${place}`
}

export function buildTeamPageDescription({ name, location, regionName }: TeamSeoSource): string {
  const place = location?.trim() || regionName?.trim() || 'España'
  return `Resultados, evolución y puntos de ${name} en el ranking de Ultimate Frisbee en ${place}.`
}

/** Título completo de equipo para `<title>` y OG (incluye marca). */
export function buildTeamDocumentTitle(source: TeamSeoSource): string {
  return `${buildTeamPageTitle(source)} · ${BRAND_SUFFIX}`
}

/**
 * Título SEO de campeonato, sin sufijo de marca (suele ser largo).
 * Ej.: «Campeonato de España Ultimate Playa Mixto, Div 1 2024-25»
 */
export function buildTournamentPageTitle(tournament: TournamentSeoSource): string {
  const modality = `${translateSurface(tournament.surface)} ${translateModality(tournament.category)}`
  const season = formatSeasonFromYear(tournament.year)

  if (tournament.type === 'CE1') {
    return `Campeonato de España Ultimate ${modality}, Div 1 ${season}`
  }

  if (tournament.type === 'CE2') {
    return `Campeonato de España Ultimate ${modality}, Div 2 ${season}`
  }

  if (tournament.type === 'REGIONAL' && tournament.region?.name) {
    return `Campeonato Regional ${tournament.region.name} Ultimate ${modality} ${season}`
  }

  return `Campeonato Ultimate ${modality} ${season}`
}

export function buildTournamentPageDescription(tournament: TournamentSeoSource): string {
  const title = buildTournamentPageTitle(tournament)
  return `Clasificación y puntos de Ultimate Frisbee en ${title}.`
}
