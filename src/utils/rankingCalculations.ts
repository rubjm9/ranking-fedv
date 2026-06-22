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
