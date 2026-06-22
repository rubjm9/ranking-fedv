// Utilidades para manejo de torneos

export interface Season {
  value: string
  label: string
  startYear: number
  endYear: number
}

export interface TournamentFormData {
  type: string
  season: string
  surface: string
  category: string
  regionId: string
  startDate: string
  endDate: string
  location: string
  divisionSize?: number
  parentTournamentId?: string
}

export interface PositionRow {
  position: number
  teamId: string
  points: number
}

// Generar temporadas desde 2016/17 hasta la actual
export const generateSeasons = (): Season[] => {
  const seasons: Season[] = []
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1 // Enero = 1
  
  // Una nueva temporada comienza el 15 de septiembre
  const isNewSeasonAvailable = currentMonth >= 9 && currentDate.getDate() >= 15
  
  const endYear = isNewSeasonAvailable ? currentYear + 1 : currentYear
  
  for (let year = 2016; year <= endYear; year++) {
    const startYear = year
    const endYearSeason = year + 1
    const value = `${startYear}-${endYearSeason.toString().slice(-2)}`
    const label = `${startYear}/${endYearSeason}`
    
    seasons.push({
      value,
      label,
      startYear,
      endYear: endYearSeason
    })
  }
  
  return seasons.reverse() // Más recientes primero
}

// Generar nombre automático del torneo
export const generateTournamentName = (
  type: string,
  regionName?: string,
  surface?: string,
  category?: string,
  season?: string
): string => {
  if (!type || !surface || !category || !season) {
    return ''
  }
  
  const typeLabels: Record<string, string> = {
    'CE1': 'Campeonato España 1ª División',
    'CE2': 'Campeonato España 2ª División',
    'REGIONAL': 'Campeonato Regional'
  }
  
  const surfaceLabels: Record<string, string> = {
    'GRASS': 'Césped',
    'BEACH': 'Playa',
    'INDOOR': 'Indoor'
  }
  
  const categoryLabels: Record<string, string> = {
    'OPEN': 'Open',
    'MIXED': 'Mixto',
    'WOMEN': 'Women'
  }
  
  const typeLabel = typeLabels[type] || type
  const surfaceLabel = surfaceLabels[surface] || surface
  const categoryLabel = categoryLabels[category] || category
  
  let name = typeLabel
  
  if (type === 'REGIONAL' && regionName) {
    name += ` ${regionName}`
  }
  
  name += ` ${surfaceLabel} ${categoryLabel} (${season})`
  
  return name
}

// Curva de puntos unificada: decaimiento por tramos (85% para los puestos 1-8,
// 90% a partir del 9). Misma forma para la curva nacional (ancla 1000) y la
// regional (ancla 100).
const NATIONAL_ANCHOR = 1000
const REGIONAL_ANCHOR = 100
const TOP_DECAY = 0.85
const TAIL_DECAY = 0.9
const TOP_POSITIONS = 8

const curvePoints = (anchor: number, curvePos: number): number => {
  if (curvePos < 1) return 0
  if (curvePos <= TOP_POSITIONS) {
    return Math.round(anchor * TOP_DECAY ** (curvePos - 1))
  }
  const base = anchor * TOP_DECAY ** (TOP_POSITIONS - 1) // valor en el puesto 8
  return Math.round(base * TAIL_DECAY ** (curvePos - TOP_POSITIONS))
}

export const nationalCurvePoints = (curvePos: number): number =>
  curvePoints(NATIONAL_ANCHOR, curvePos)

export const regionalCurvePoints = (pos: number): number =>
  curvePoints(REGIONAL_ANCHOR, pos)

// Tamaño de división por defecto de la 1ª (estructura real con regionales: 16 + 16).
export const DEFAULT_DIVISION_SIZE = 16

// Offset = nº de equipos de 1ª que preceden a la 2ª en la curva nacional.
// CE2: el tamaño de su 1ª asociada (almacenado en su propio divisionSize); 0 para CE1/REGIONAL.
export const getOffsetForTournament = (
  tournamentType: string,
  divisionSize?: number | null
): number => {
  if (tournamentType === 'CE2') return divisionSize ?? DEFAULT_DIVISION_SIZE
  return 0
}

// Obtener puntos según la posición y tipo de torneo.
// `offset` = nº de equipos de 1ª que preceden a la 2ª en la curva (0 para CE1/REGIONAL).
// Un CE2 continúa la curva nacional justo después del último equipo de su CE1.
export const getPointsForPosition = (
  position: number,
  tournamentType: string,
  offset = 0
): number => {
  if (tournamentType === 'REGIONAL') return regionalCurvePoints(position)
  if (tournamentType === 'CE1') return nationalCurvePoints(position)
  if (tournamentType === 'CE2') return nationalCurvePoints(position + offset)
  return 0
}

// Generar filas de posiciones por defecto
export const generateDefaultPositions = (
  tournamentType: string,
  offset = 0
): PositionRow[] => {
  return Array.from({ length: 3 }, (_, i) => ({
    position: i + 1,
    teamId: '',
    points: getPointsForPosition(i + 1, tournamentType, offset)
  }))
}

// Validar fechas del torneo
export const validateTournamentDates = (startDate: string, endDate: string): string | null => {
  if (!startDate || !endDate) {
    return 'Las fechas de inicio y fin son requeridas'
  }
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (start > end) {
    return 'La fecha de inicio no puede ser posterior a la fecha de fin'
  }
  
  return null
}

// Obtener año de la temporada para el backend
export const getYearFromSeason = (season: string): number => {
  return parseInt(season.split('-')[0])
}

/** Etiqueta legible de la combinación tipo + superficie + categoría (+ región/temporada) */
export const formatTournamentCombinationLabel = (params: {
  type: string
  surface: string
  category: string
  season?: string
  regionName?: string
}): string => {
  const typeShort: Record<string, string> = {
    CE1: '1ª división',
    CE2: '2ª división',
    REGIONAL: 'regional',
  }
  const surfaceShort: Record<string, string> = {
    GRASS: 'césped',
    BEACH: 'playa',
    INDOOR: 'indoor',
  }
  const categoryShort: Record<string, string> = {
    OPEN: 'open',
    WOMEN: 'femenino',
    MIXED: 'mixto',
  }

  const parts = [
    categoryShort[params.category] ?? params.category.toLowerCase(),
    typeShort[params.type] ?? params.type.toLowerCase(),
    surfaceShort[params.surface] ?? params.surface.toLowerCase(),
  ]
  if (params.regionName) parts.push(params.regionName)
  if (params.season) parts.push(params.season)
  return parts.join(', ')
}
