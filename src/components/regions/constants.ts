export const MODALITY_LABELS: Record<string, string> = {
  beach_mixed: 'Playa mixto',
  beach_open: 'Playa open',
  beach_women: 'Playa femenino',
  grass_mixed: 'Césped mixto',
  grass_open: 'Césped open',
  grass_women: 'Césped femenino',
}

export const MODALITY_SHORT: Record<string, string> = {
  beach_mixed: 'PM',
  beach_open: 'PO',
  beach_women: 'PF',
  grass_mixed: 'CM',
  grass_open: 'CO',
  grass_women: 'CF',
}

export const MODALITIES = [
  'beach_mixed',
  'beach_open',
  'beach_women',
  'grass_mixed',
  'grass_open',
  'grass_women',
] as const

export const MODALITY_ITEMS = [
  { key: 'beach_mixed', label: 'Playa mixto', surface: 'BEACH' as const },
  { key: 'beach_open', label: 'Playa open', surface: 'BEACH' as const },
  { key: 'beach_women', label: 'Playa femenino', surface: 'BEACH' as const },
  { key: 'grass_mixed', label: 'Césped mixto', surface: 'GRASS' as const },
  { key: 'grass_open', label: 'Césped open', surface: 'GRASS' as const },
  { key: 'grass_women', label: 'Césped femenino', surface: 'GRASS' as const },
] as const

export const getCoefficientColor = (coef: number) => {
  if (coef >= 1.15) return 'bg-emerald-100 text-emerald-800'
  if (coef >= 1.0) return 'bg-primary-100 text-primary-800'
  if (coef >= 0.9) return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-700'
}

export const getCoefficientStyle = (coef: number) => {
  if (coef >= 1.15) return { label: 'Alta competitividad', badge: 'badge-success', bar: 'bg-emerald-500' }
  if (coef >= 1.0) return { label: 'Competitividad media', badge: 'badge-primary', bar: 'bg-primary-500' }
  if (coef >= 0.9) return { label: 'Competitividad baja', badge: 'badge-warning', bar: 'bg-amber-500' }
  return { label: 'Competitividad muy baja', badge: 'badge-error', bar: 'bg-red-500' }
}
