/**
 * Servicio para la administración de subtemporadas: listar torneos por subtemporada,
 * comprobar si tienen resultados y obtener última actualización de rankings.
 */

import { supabase } from './supabaseService'
import { getYearFromSeason } from '@/utils/tournamentUtils'

export type SubseasonId = 1 | 2 | 3 | 4

export interface TournamentMonitorItem {
  id: string
  name: string
  type: string
  hasPositions: boolean
  /** Para tabla: superficie (BEACH/GRASS) */
  surface?: string
  /** Para tabla: categoría (MIXED/OPEN/WOMEN) */
  category?: string
  /** Número de posiciones/equipos */
  positionCount?: number
}

/** Un torneo con clave surface+category (y regionId si REGIONAL) para la tabla por celdas */
export interface TournamentCellItem {
  id: string
  name: string
  type: string
  surface: string
  category: string
  positionCount: number
  /** Para filas REGIONAL: id de la región del torneo */
  regionId: string | null
  /** Opcional: nombre de la región */
  regionName?: string | null
}

export interface SubseasonBlock {
  id: SubseasonId
  label: string
  tournaments: TournamentMonitorItem[]
}

export interface SubseasonMonitorData {
  season: string
  subseasons: SubseasonBlock[]
  /** Torneos con surface/category para montar la tabla 6 columnas × tipos */
  flatTournaments: TournamentCellItem[]
  lastUpdated: string | null
  /** Si la temporada tiene ya rankings calculados (muestra "Recalcular" en vez de "Cerrar") */
  hasBeenClosed: boolean
  /** Por subtemporada: si ya se han calculado rankings (muestra "Recalcular" en ese botón) */
  subseasonClosed: Record<SubseasonId, boolean>
}

const SUBSEASON_LABELS: Record<SubseasonId, string> = {
  1: 'Playa mixto',
  2: 'Playa open/women',
  3: 'Césped mixto',
  4: 'Césped open/women'
}

/**
 * Mapea superficie + categoría a subtemporada (1-4).
 * Igual que en EditTournamentPage: beach+mixed→1, beach+open/women→2, grass+mixed→3, grass+open/women→4.
 */
function getSubseasonFromTournament(surface: string, category: string): SubseasonId | null {
  const s = (surface || '').toLowerCase()
  const c = (category || '').toLowerCase()
  if (s === 'beach' && c === 'mixed') return 1
  if (s === 'beach' && (c === 'open' || c === 'women')) return 2
  if (s === 'grass' && c === 'mixed') return 3
  if (s === 'grass' && (c === 'open' || c === 'women')) return 4
  return null
}

const subseasonAdminService = {
  /**
   * Obtiene las temporadas disponibles (años que tienen torneos en la BD).
   */
  async getSeasonsFromDb(): Promise<{ value: string; label: string }[]> {
    if (!supabase) throw new Error('Supabase no está configurado')
    const { data, error } = await supabase
      .from('tournaments')
      .select('year')
      .order('year', { ascending: false })
    if (error) throw error
    const years = [...new Set((data || []).map((r: { year: number }) => r.year))]
    return years.map(year => {
      const next = (year + 1).toString().slice(-2)
      return { value: `${year}-${next}`, label: `${year}/${year + 1}` }
    })
  },

  /**
   * Obtiene datos para el monitor de subtemporadas: torneos por subtemporada,
   * si tienen posiciones, última actualización y si la temporada ya se cerró alguna vez.
   */
  async getMonitorData(season: string): Promise<SubseasonMonitorData> {
    if (!supabase) throw new Error('Supabase no está configurado')
    const year = getYearFromSeason(season)

    const { data: tournaments, error: tError } = await supabase
      .from('tournaments')
      .select(`
        id, name, type, surface, category, regionId,
        positions(id),
        region:regions(name)
      `)
      .eq('year', year)

    if (tError) throw tError

    const list = (tournaments || []) as Array<{
      id: string
      name: string
      type: string
      surface: string
      category: string
      regionId: string | null
      positions: { id: string }[] | null
      region: { name: string } | null
    }>

    const bySubseason: Record<SubseasonId, TournamentMonitorItem[]> = {
      1: [], 2: [], 3: [], 4: []
    }

    const flatTournaments: TournamentCellItem[] = []

    for (const t of list) {
      const sub = getSubseasonFromTournament(t.surface, t.category)
      const positionCount = Array.isArray(t.positions) ? t.positions.length : 0
      const hasPositions = positionCount > 0
      if (sub) {
        bySubseason[sub].push({
          id: t.id,
          name: t.name,
          type: t.type,
          hasPositions,
          surface: t.surface,
          category: t.category,
          positionCount
        })
      }
      flatTournaments.push({
        id: t.id,
        name: t.name,
        type: t.type,
        surface: (t.surface || '').toUpperCase(),
        category: (t.category || '').toUpperCase(),
        positionCount,
        regionId: t.regionId ?? null,
        regionName: t.region?.name ?? null
      })
    }

    const subseasons: SubseasonBlock[] = [1, 2, 3, 4].map(id => ({
      id: id as SubseasonId,
      label: SUBSEASON_LABELS[id as SubseasonId],
      tournaments: bySubseason[id as SubseasonId] || []
    }))

    let lastUpdated: string | null = null
    let hasBeenClosed = false

    const { data: pointsRow } = await supabase
      .from('team_season_points')
      .select('subseason_ranks_calculated_at')
      .eq('season', season)
      .not('subseason_ranks_calculated_at', 'is', null)
      .limit(1)
      .maybeSingle()

    if (pointsRow?.subseason_ranks_calculated_at) {
      hasBeenClosed = true
      lastUpdated = pointsRow.subseason_ranks_calculated_at
    }

    if (!lastUpdated) {
      const { data: rankRow } = await supabase
        .from('team_season_rankings')
        .select('calculated_at')
        .eq('season', season)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (rankRow?.calculated_at) lastUpdated = rankRow.calculated_at
    }

    const subseasonClosed: Record<SubseasonId, boolean> = { 1: false, 2: false, 3: false, 4: false }
    const { data: pointsRows } = await supabase
      .from('team_season_points')
      .select(
        'subseason_1_beach_mixed_rank, subseason_2_beach_open_rank, subseason_2_beach_women_rank, subseason_3_grass_mixed_rank, subseason_4_grass_open_rank, subseason_4_grass_women_rank'
      )
      .eq('season', season)
      .limit(100)

    if (pointsRows?.length) {
      subseasonClosed[1] = pointsRows.some((r: any) => r.subseason_1_beach_mixed_rank != null)
      subseasonClosed[2] = pointsRows.some((r: any) => r.subseason_2_beach_open_rank != null || r.subseason_2_beach_women_rank != null)
      subseasonClosed[3] = pointsRows.some((r: any) => r.subseason_3_grass_mixed_rank != null)
      subseasonClosed[4] = pointsRows.some((r: any) => r.subseason_4_grass_open_rank != null || r.subseason_4_grass_women_rank != null)
    }

    return {
      season,
      subseasons,
      flatTournaments,
      lastUpdated,
      hasBeenClosed,
      subseasonClosed
    }
  }
}

export default subseasonAdminService
