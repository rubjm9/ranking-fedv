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

// Obtener puntos según la posición y tipo de torneo
export const getPointsForPosition = (position: number, tournamentType: string): number => {
  const pointsTables = {
    CE1: {
      1: 1000, 2: 850, 3: 725, 4: 625, 5: 520, 6: 450, 7: 380, 8: 320,
      9: 270, 10: 230, 11: 195, 12: 165, 13: 140, 14: 120, 15: 105, 16: 90,
      17: 75, 18: 65, 19: 55, 20: 46, 21: 39, 22: 34, 23: 30, 24: 27
    },
    CE2: {
      1: 230, 2: 195, 3: 165, 4: 140, 5: 120, 6: 103, 7: 86, 8: 74,
      9: 63, 10: 54, 11: 46, 12: 39, 13: 34, 14: 29, 15: 25, 16: 21,
      17: 18, 18: 15, 19: 13, 20: 11, 21: 9, 22: 8, 23: 7, 24: 6
    },
    REGIONAL: {
      1: 140, 2: 120, 3: 100, 4: 85, 5: 72, 6: 60, 7: 50, 8: 42,
      9: 35, 10: 30, 11: 25, 12: 21, 13: 18, 14: 15, 15: 13, 16: 11,
      17: 9, 18: 8, 19: 7, 20: 6, 21: 5, 22: 4, 23: 3, 24: 2
    }
  }
  
  const table = pointsTables[tournamentType as keyof typeof pointsTables]
  return table?.[position] || 0
}

// Generar filas de posiciones por defecto
export const generateDefaultPositions = (tournamentType: string): PositionRow[] => {
  return Array.from({ length: 3 }, (_, i) => ({
    position: i + 1,
    teamId: '',
    points: getPointsForPosition(i + 1, tournamentType)
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
