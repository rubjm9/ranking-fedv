/**
 * Coeficientes de antigüedad por subtemporada para el ranking global.
 * Solo la superficie ya jugada en la subtemporada actual usa coeficiente x1 en la temporada en curso.
 */

export interface CoeffConfig {
  [surface: string]: {
    [season: string]: number
  }
}

export const ALL_RANKING_SURFACES = [
  'beach_mixed',
  'beach_open',
  'beach_women',
  'grass_mixed',
  'grass_open',
  'grass_women',
] as const

export type RankingSurface = (typeof ALL_RANKING_SURFACES)[number]

export type Subupdate = 1 | 2 | 3 | 4

export interface TeamSeasonPointsRow {
  team_id: string
  season: string
  beach_mixed_points?: number
  beach_open_points?: number
  beach_women_points?: number
  grass_mixed_points?: number
  grass_open_points?: number
  grass_women_points?: number
}

const formatSeason = (startYear: number): string =>
  `${startYear}-${String(startYear + 1).slice(-2)}`

/**
 * Temporadas necesarias para calcular un snapshot global de subtemporada.
 */
export const getSeasonsNeededForSubupdate = (
  subupdate: Subupdate,
  currentSeason: string
): string[] => {
  const currentYear = parseInt(currentSeason.split('-')[0])
  const maxOffset = subupdate <= 2 ? 4 : 3
  const seasons: string[] = [currentSeason]
  for (let offset = 1; offset <= maxOffset; offset++) {
    seasons.push(formatSeason(currentYear - offset))
  }
  return seasons
}

/**
 * Temporadas necesarias para calcular todos los snapshots (1-4) de una temporada.
 */
export const getAllSeasonsNeededForSubupdates = (currentSeason: string): string[] => {
  const seasons = new Set<string>()
  ;([1, 2, 3, 4] as Subupdate[]).forEach((subupdate) => {
    getSeasonsNeededForSubupdate(subupdate, currentSeason).forEach((s) => seasons.add(s))
  })
  return [...seasons]
}

/**
 * Configuración de coeficientes por superficie y temporada para una subtemporada.
 */
export const getCoefficientsForSubupdate = (
  subupdate: Subupdate,
  currentSeason: string
): CoeffConfig => {
  const config: CoeffConfig = {}
  const currentYear = parseInt(currentSeason.split('-')[0])

  ALL_RANKING_SURFACES.forEach((surface) => {
    config[surface] = {}

    if (subupdate === 1) {
      if (surface === 'beach_mixed') {
        config[surface][currentSeason] = 1.0
        config[surface][formatSeason(currentYear - 1)] = 0.8
        config[surface][formatSeason(currentYear - 2)] = 0.5
        config[surface][formatSeason(currentYear - 3)] = 0.2
      } else {
        config[surface][formatSeason(currentYear - 1)] = 1.0
        config[surface][formatSeason(currentYear - 2)] = 0.8
        config[surface][formatSeason(currentYear - 3)] = 0.5
        config[surface][formatSeason(currentYear - 4)] = 0.2
      }
    } else if (subupdate === 2) {
      if (surface === 'beach_mixed') {
        config[surface][currentSeason] = 1.0
        config[surface][formatSeason(currentYear - 1)] = 0.8
        config[surface][formatSeason(currentYear - 2)] = 0.5
        config[surface][formatSeason(currentYear - 3)] = 0.2
      } else if (surface === 'beach_open' || surface === 'beach_women') {
        config[surface][currentSeason] = 1.0
        config[surface][formatSeason(currentYear - 1)] = 0.8
        config[surface][formatSeason(currentYear - 2)] = 0.5
        config[surface][formatSeason(currentYear - 3)] = 0.2
      } else {
        config[surface][formatSeason(currentYear - 1)] = 1.0
        config[surface][formatSeason(currentYear - 2)] = 0.8
        config[surface][formatSeason(currentYear - 3)] = 0.5
        config[surface][formatSeason(currentYear - 4)] = 0.2
      }
    } else if (subupdate === 3) {
      if (surface === 'grass_mixed') {
        config[surface][currentSeason] = 1.0
        config[surface][formatSeason(currentYear - 1)] = 0.8
        config[surface][formatSeason(currentYear - 2)] = 0.5
        config[surface][formatSeason(currentYear - 3)] = 0.2
      } else if (
        surface === 'beach_mixed' ||
        surface === 'beach_open' ||
        surface === 'beach_women'
      ) {
        config[surface][currentSeason] = 1.0
        config[surface][formatSeason(currentYear - 1)] = 0.8
      } else {
        config[surface][formatSeason(currentYear - 1)] = 1.0
        config[surface][formatSeason(currentYear - 2)] = 0.8
      }
    } else {
      config[surface][currentSeason] = 1.0
      config[surface][formatSeason(currentYear - 1)] = 0.8
      config[surface][formatSeason(currentYear - 2)] = 0.5
      config[surface][formatSeason(currentYear - 3)] = 0.2
    }
  })

  return config
}

/**
 * Puntos globales ponderados de un equipo para una subtemporada (función pura, sin I/O).
 */
export const computeWeightedPointsForSubupdate = (
  teamPointsRows: TeamSeasonPointsRow[],
  teamId: string,
  subupdate: Subupdate,
  currentSeason: string
): number => {
  const coefficients = getCoefficientsForSubupdate(subupdate, currentSeason)
  const teamRows = teamPointsRows.filter((row) => row.team_id === teamId)
  let totalPoints = 0

  ALL_RANKING_SURFACES.forEach((surface) => {
    const surfaceCoeffs = coefficients[surface] || {}
    Object.entries(surfaceCoeffs).forEach(([season, coeff]) => {
      const row = teamRows.find((r) => r.season === season)
      const basePoints = row?.[`${surface}_points`] || 0
      if (basePoints > 0) {
        totalPoints += basePoints * coeff
      }
    })
  })

  return parseFloat(totalPoints.toFixed(2))
}

/**
 * Puntos globales de todos los equipos para una subtemporada (batch en memoria).
 */
export const computeAllTeamsGlobalPointsForSubupdate = (
  allRows: TeamSeasonPointsRow[],
  subupdate: Subupdate,
  currentSeason: string
): Map<string, number> => {
  const teamIds = new Set(allRows.map((row) => row.team_id))
  const result = new Map<string, number>()

  teamIds.forEach((teamId) => {
    const points = computeWeightedPointsForSubupdate(allRows, teamId, subupdate, currentSeason)
    if (points > 0) {
      result.set(teamId, points)
    }
  })

  return result
}
