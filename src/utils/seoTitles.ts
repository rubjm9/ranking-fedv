import { SURFACE_LABELS } from '@/constants/surfaces'
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

export interface RegionSeoSource {
  name: string
}

export function buildRegionPageTitle({ name }: RegionSeoSource): string {
  return `${name}, Ultimate Frisbee España`
}

export function buildRegionPageDescription({ name }: RegionSeoSource): string {
  return `Equipos, campeonatos y coeficiente regional de ${name} en el ranking de Ultimate Frisbee FEDV.`
}

const RANKING_DESCRIPTIONS: Partial<Record<string, string>> = {
  resumen:
    'Resumen del ranking de Ultimate Frisbee en España: clasificación general, modalidades y evolución de equipos.',
  general:
    'Ranking general de Ultimate Frisbee en España con puntos ponderados por temporada y coeficiente regional.',
  playa: 'Ranking de Ultimate Frisbee en playa: clasificación por modalidad y puntos de equipos en España.',
  cesped: 'Ranking de Ultimate Frisbee en césped: clasificación por modalidad y puntos de equipos en España.',
  mixto: 'Ranking mixto de Ultimate Frisbee en España: posiciones y puntos por temporada.',
  open: 'Ranking open de Ultimate Frisbee en España: posiciones y puntos por temporada.',
  women: 'Ranking women de Ultimate Frisbee en España: posiciones y puntos por temporada.',
  'beach-mixed': 'Ranking de Ultimate Frisbee playa mixto en España.',
  'beach-women': 'Ranking de Ultimate Frisbee playa women en España.',
  'beach-open': 'Ranking de Ultimate Frisbee playa open en España.',
  'grass-mixed': 'Ranking de Ultimate Frisbee césped mixto en España.',
  'grass-women': 'Ranking de Ultimate Frisbee césped women en España.',
  'grass-open': 'Ranking de Ultimate Frisbee césped open en España.',
}

/** Parte del título antes del sufijo «· Ranking FEDV». El h1 del hero puede diferir (UX). */
export function buildRankingPageTitle(surface: string): string {
  const label = SURFACE_LABELS[surface] ?? 'Ranking'
  return `${label} de Ultimate Frisbee`
}

export function buildRankingPageDescription(surface: string): string {
  return (
    RANKING_DESCRIPTIONS[surface] ??
    'Ranking de Ultimate Frisbee en España: puntos por temporada, coeficiente regional y evolución de cada equipo.'
  )
}
