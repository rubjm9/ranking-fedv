import { supabase } from '@/services/supabaseService'
import seasonService from '@/services/seasonService'

export interface BreakdownEntry {
  tournamentId: string
  tournamentName: string
  /** CE1, CE2, REGIONAL, INTERNATIONAL… */
  type: string
  position: number
  /** Puntos que otorga la posición, antes del coeficiente regional. */
  basePoints: number
  /** Solo los torneos regionales llevan coeficiente; los CE valen 1. */
  regionalCoefficient: number
  /** basePoints × regionalCoefficient. */
  points: number
  /** Modalidad del torneo, en formato `superficie_categoría`. */
  modality: string
  /** Equipo que consiguió el resultado; relevante en el ranking de clubes. */
  teamId: string
}

export interface SeasonBreakdown {
  season: string
  /** Suma de las entradas: debe coincidir con la celda de la tabla. */
  total: number
  entries: BreakdownEntry[]
}

/**
 * Desglose de los puntos que un equipo sumó en una temporada y modalidad.
 *
 * Replica la misma fórmula con la que `seasonPointsService` construye la caché
 * `team_season_points`, de modo que la suma de las entradas coincide con el
 * número que muestra la tabla. Si se cambia una, hay que cambiar la otra.
 */
export async function getSeasonBreakdown(
  /**
   * Equipos cuyos resultados se suman. En el ranking de clubes son el equipo
   * principal y sus filiales; en el resto, uno solo.
   */
  teamIds: string[],
  season: string,
  /**
   * Modalidades incluidas, en formato `superficie_categoría`. La vista global
   * suma varias, así que se acepta una lista.
   */
  surfaceCategories: string[],
  teamRegionId?: string
): Promise<SeasonBreakdown> {
  if (!supabase) return { season, total: 0, entries: [] }

  const seasonYear = parseInt(season.split('-')[0], 10)
  const modalidades = new Set(surfaceCategories)

  const { data, error } = await supabase
    .from('positions')
    .select(
      `id, position, points, teamId,
       tournaments:tournamentId ( id, name, year, type, surface, category ),
       teams:teamId ( id, regionId )`
    )
    .in('teamId', teamIds)
    .eq('tournaments.year', seasonYear)

  if (error) throw error

  const modalidadDe = (t: any) =>
    `${t.surface?.toLowerCase()}_${t.category?.toLowerCase()}`

  const filas = (data || []).filter(
    (p: any) => p.tournaments && modalidades.has(modalidadDe(p.tournaments))
  )

  if (filas.length === 0) return { season, total: 0, entries: [] }

  // El coeficiente aplicable a los regionales de la temporada T se calcula con T-1.
  const hayRegionales = filas.some((p: any) => p.tournaments.type === 'REGIONAL')
  const coeficientes = new Map<string, number>()
  if (hayRegionales) {
    const base = `${seasonYear - 1}-${String(seasonYear).slice(-2)}`
    const lista = await seasonService.getRegionalCoefficients(base)
    lista.forEach((c: any) => coeficientes.set(`${c.regionId}-${c.modality}`, c.coefficient))
  }

  const entries: BreakdownEntry[] = filas
    .map((p: any) => {
      const modalidad = modalidadDe(p.tournaments)
      const esRegional = p.tournaments.type === 'REGIONAL'
      // Cada equipo puede pertenecer a una región distinta.
      const regionId = teamRegionId ?? p.teams?.regionId
      const coef = esRegional
        ? coeficientes.get(`${regionId}-${modalidad}`) ?? 1.0
        : 1.0
      const basePoints = p.points || 0
      return {
        tournamentId: p.tournaments.id,
        teamId: p.teamId,
        tournamentName: p.tournaments.name,
        type: p.tournaments.type,
        position: p.position,
        basePoints,
        regionalCoefficient: coef,
        points: basePoints * coef,
        modality: modalidad,
      }
    })
    .sort((a, b) => b.points - a.points)

  return {
    season,
    total: entries.reduce((s, e) => s + e.points, 0),
    entries,
  }
}
