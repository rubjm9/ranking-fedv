/** Mapeo slug de `/ranking/:surface` → columnas en `team_season_rankings`. */
export type TeamSeasonRankingRow = {
  team_id: string
  season: string
  global_rank: number | null
  global_points: number | null
  beach_mixed_rank: number | null
  beach_mixed_points: number | null
  beach_open_rank: number | null
  beach_open_points: number | null
  beach_women_rank: number | null
  beach_women_points: number | null
  grass_mixed_rank: number | null
  grass_mixed_points: number | null
  grass_open_rank: number | null
  grass_open_points: number | null
  grass_women_rank: number | null
  grass_women_points: number | null
}

type RankPointsKeys = {
  rankKey: keyof TeamSeasonRankingRow
  pointsKey: keyof TeamSeasonRankingRow
}

export const RANKING_SURFACE_DB: Record<string, RankPointsKeys | 'aggregate'> = {
  'beach-mixed': { rankKey: 'beach_mixed_rank', pointsKey: 'beach_mixed_points' },
  'beach-open': { rankKey: 'beach_open_rank', pointsKey: 'beach_open_points' },
  'beach-women': { rankKey: 'beach_women_rank', pointsKey: 'beach_women_points' },
  'grass-mixed': { rankKey: 'grass_mixed_rank', pointsKey: 'grass_mixed_points' },
  'grass-open': { rankKey: 'grass_open_rank', pointsKey: 'grass_open_points' },
  'grass-women': { rankKey: 'grass_women_rank', pointsKey: 'grass_women_points' },
  general: { rankKey: 'global_rank', pointsKey: 'global_points' },
  resumen: 'aggregate',
  playa: 'aggregate',
  cesped: 'aggregate',
  mixto: 'aggregate',
  open: 'aggregate',
  women: 'aggregate',
}

/** Modalidad representativa para vistas agregadas (top simplificado en prerender). */
export const AGGREGATE_SURFACE_REPRESENTATIVE: Partial<Record<string, RankPointsKeys>> = {
  playa: { rankKey: 'beach_mixed_rank', pointsKey: 'beach_mixed_points' },
  cesped: { rankKey: 'grass_mixed_rank', pointsKey: 'grass_mixed_points' },
  mixto: { rankKey: 'beach_mixed_rank', pointsKey: 'beach_mixed_points' },
  open: { rankKey: 'beach_open_rank', pointsKey: 'beach_open_points' },
  women: { rankKey: 'beach_women_rank', pointsKey: 'beach_women_points' },
}
