/** Etiqueta legible de cada slug, para el título de la pestaña del navegador. */
export const SURFACE_LABELS: Record<string, string> = {
  resumen: 'Resumen',
  summary: 'Resumen',
  general: 'Ranking general',
  playa: 'Ranking de playa',
  cesped: 'Ranking de césped',
  mixto: 'Ranking mixto',
  open: 'Ranking open',
  women: 'Ranking women',
  'beach-mixed': 'Playa mixto',
  'beach-women': 'Playa women',
  'beach-open': 'Playa open',
  'grass-mixed': 'Césped mixto',
  'grass-women': 'Césped women',
  'grass-open': 'Césped open',
}

/** Slugs válidos de `/ranking/:surface` (sin alias legacy como `summary`). */
export const SURFACES = [
  'resumen',
  'general',
  'playa',
  'cesped',
  'mixto',
  'open',
  'women',
  'beach-mixed',
  'beach-women',
  'beach-open',
  'grass-mixed',
  'grass-women',
  'grass-open',
] as const

export type SurfaceSlug = (typeof SURFACES)[number]
