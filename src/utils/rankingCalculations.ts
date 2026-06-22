import { RegionalCoefficientConfig } from '@/types'

export const MODALITIES = [
  'beach_mixed',
  'beach_open',
  'beach_women',
  'grass_mixed',
  'grass_open',
  'grass_women',
] as const

export type Modality = typeof MODALITIES[number]

export const DEFAULT_REGIONAL_CONFIG: RegionalCoefficientConfig = {
  floor: 0.8,
  ceiling: 1.2,
  increment: 0.05,
}

export const DEFAULT_TEMPORAL_WEIGHTS = {
  current: 1.0,
  previous: 0.8,
  twoAgo: 0.5,
  threeAgo: 0.2,
}

/** Temporada inmediatamente anterior (ej: 2025-26 → 2024-25). */
export const getPreviousSeasonLabel = (season: string): string => {
  const year = parseInt(season.split('-')[0])
  return `${year - 1}-${String(year).slice(-2)}`
}

/** Temporada inmediatamente siguiente (ej: 2023-24 → 2024-25). */
export const getNextSeasonLabel = (season: string): string => {
  const year = parseInt(season.split('-')[0])
  return `${year + 1}-${String(year + 2).slice(-2)}`
}

/**
 * Temporada cuyos coeficientes regionales se muestran para la temporada actual.
 * Convención: coeficientes calculados con datos de T-1 se aplican a regionales de T.
 */
export const getRegionalCoefficientBaseSeason = (currentSeason: string): string =>
  getPreviousSeasonLabel(currentSeason)

/** Etiqueta de temporada a partir del año de inicio (ej: 2024 → 2024-25). */
export const formatSeasonFromYear = (year: number): string =>
  `${year}-${String(year + 1).slice(-2)}`

const POINTS_DECIMALS = 2

/** Redondea puntos a decimales fijos (evita errores de coma flotante). */
export const roundPoints = (points: number, decimals = POINTS_DECIMALS): number =>
  parseFloat(points.toFixed(decimals))

/** Formato de visualización de puntos con decimales. */
export const formatPoints = (points: number, decimals = POINTS_DECIMALS): string =>
  points.toFixed(decimals)

/** Clave de modalidad usada en regional_coefficients (ej: BEACH + MIXED → beach_mixed). */
export const getModalityKey = (surface: string, category: string): string =>
  `${surface.toLowerCase()}_${category.toLowerCase()}`

/**
 * Coeficiente regional aplicable a un torneo REGIONAL.
 * Convención: coeficientes de prevSeason se aplican a regionales de season.
 */
export const getRegionalCoefficientForTournament = (
  coefficients: Array<{ regionId: string; modality: string; coefficient: number }>,
  regionId: string,
  surface: string,
  category: string
): number => {
  const modality = getModalityKey(surface, category)
  const match = coefficients.find(c => c.regionId === regionId && c.modality === modality)
  return match?.coefficient ?? 1.0
}

/** Lookup O(1) para coeficientes: clave `${season}-${regionId}-${modality}`. */
export const buildRegionalCoefficientLookup = (
  coefficients: Array<{ season: string; regionId: string; modality: string; coefficient: number }>
): Map<string, number> => {
  const map = new Map<string, number>()
  for (const c of coefficients) {
    map.set(`${c.season}-${c.regionId}-${c.modality}`, c.coefficient)
  }
  return map
}

/** Puntos finales de un torneo REGIONAL (base × coeficiente de T-1). */
export const getWeightedRegionalPoints = (
  basePoints: number,
  tournamentType: string,
  surface: string,
  category: string,
  teamRegionId: string | undefined,
  tournamentSeason: string,
  lookup: Map<string, number>
): { points: number; coefficient: number; basePoints: number } => {
  if (tournamentType !== 'REGIONAL' || !teamRegionId) {
    return { points: basePoints, coefficient: 1, basePoints }
  }
  const baseSeason = getRegionalCoefficientBaseSeason(tournamentSeason)
  const modality = getModalityKey(surface, category)
  const coefficient = lookup.get(`${baseSeason}-${teamRegionId}-${modality}`) ?? 1.0
  return {
    points: roundPoints(basePoints * coefficient),
    coefficient,
    basePoints,
  }
}

/**
 * Calcula el coeficiente regional para una región dada su puntuación y la media nacional.
 *
 * Fórmula: coef = clamp(1.0 + (pts - media) / media × k, floor, ceiling)
 * donde k = ceiling - 1.0 (= 0.20 con los valores por defecto).
 *
 * El parámetro k no es arbitrario: es exactamente el tope superior menos 1.
 * Una región que doble la media obtiene coeficiente máximo (+20%).
 * Una región en cero obtiene coeficiente mínimo (−20%).
 */
export const calculateRegionalCoefficient = (
  regionPoints: number,
  nationalMean: number,
  config: RegionalCoefficientConfig = DEFAULT_REGIONAL_CONFIG
): number => {
  if (nationalMean <= 0 || regionPoints < 0) return 1.0
  const k = config.ceiling - 1.0
  const raw = 1.0 + ((regionPoints - nationalMean) / nationalMean) * k
  const clamped = Math.min(config.ceiling, Math.max(config.floor, raw))
  return Math.round(clamped / config.increment) * config.increment
}
