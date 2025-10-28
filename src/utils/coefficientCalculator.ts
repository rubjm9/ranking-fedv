/**
 * Helper para calcular coeficientes de antigüedad según subtemporada
 * Aplica la lógica correcta donde solo la modalidad jugada tiene x1
 * y las demás mantienen sus coeficientes anteriores
 * 
 * NOTA: Actualmente NO se usa. Simplificado para calcular rankings globales
 * sumando directamente las 6 modalidades de team_season_rankings.
 */

export interface CoeffConfig {
  [modality: string]: {
    [season: string]: number
  }
}

// TODOs:
// - Implementar cálculo de coeficientes específicos por subtemporada
// - Este archivo está preparado para la funcionalidad futura

/**
 * Calcular configuración de coeficientes para cada subtemporada
 */
export const getCoefficientsForSubupdate = (
  subupdate: 1 | 2 | 3 | 4,
  currentSeason: string
): CoeffConfig => {
  const config: CoeffConfig = {}
  
  // Modalities
  const modalities = [
    'beach_mixed',
    'beach_open',
    'beach_women', 
    'grass_mixed',
    'grass_open',
    'grass_women'
  ]
  
  // Calcular años de las temporadas
  const currentYear = parseInt(currentSeason.split('-')[0])
  
  modalities.forEach(modality => {
    config[modality] = {}
    
    if (subupdate === 1) {
      // SUBUPDATE 1: Después de jugarse playa mixto
      if (modality === 'beach_mixed') {
        // Play mixto: actual*1, prev*0.8, prev2*0.5, prev3*0.2
        config[modality][currentSeason] = 1.0
        config[modality][`${currentYear - 1}-${(currentYear).toString().slice(-2)}`] = 0.8
        config[modality][`${currentYear - 2}-${(currentYear - 1).toString().slice(-2)}`] = 0.5
        config[modality][`${currentYear - 3}-${(currentYear - 2).toString().slice(-2)}`] = 0.2
      } else {
        // Otras modalidades: prev*1, prev2*0.8, prev3*0.5, prev4*0.2
        config[modality][`${currentYear - 1}-${(currentYear).toString().slice(-2)}`] = 1.0
        config[modality][`${currentYear - 2}-${(currentYear - 1).toString().slice(-2)}`] = 0.8
        config[modality][`${currentYear - 3}-${(currentYear - 2).toString().slice(-2)}`] = 0.5
        config[modality][`${currentYear - 4}-${(currentYear - 3).toString().slice(-2)}`] = 0.2
      }
    } else if (subupdate === 2) {
      // SUBUPDATE 2: Después de jugarse playa open/women
      if (modality === 'beach_mixed') {
        // Play mixto: actual*1, prev*0.8, prev2*0.5, prev3*0.2 (ya se jugó)
        config[modality][currentSeason] = 1.0
        config[modality][`${currentYear - 1}-${(currentYear).toString().slice(-2)}`] = 0.8
        config[modality][`${currentYear - 2}-${(currentYear - 1).toString().slice(-2)}`] = 0.5
        config[modality][`${currentYear - 3}-${(currentYear - 2).toString().slice(-2)}`] = 0.2
      } else if (modality === 'beach_open' || modality === 'beach_women') {
        // Play open/women: actual*1, prev*0.8, prev2*0.5, prev3*0.2
        config[modality][currentSeason] = 1.0
        config[modality][`${currentYear - 1}-${(currentYear).toString().slice(-2)}`] = 0.8
        config[modality][`${currentYear - 2}-${(currentYear - 1).toString().slice(-2)}`] = 0.5
        config[modality][`${currentYear - 3}-${(currentYear - 2).toString().slice(-2)}`] = 0.2
      } else {
        // Césped: prev*1, prev2*0.8, prev3*0.5, prev4*0.2
        config[modality][`${currentYear - 1}-${(currentYear).toString().slice(-2)}`] = 1.0
        config[modality][`${currentYear - 2}-${(currentYear - 1).toString().slice(-2)}`] = 0.8
        config[modality][`${currentYear - 3}-${(currentYear - 2).toString().slice(-2)}`] = 0.5
        config[modality][`${currentYear - 4}-${(currentYear - 3).toString().slice(-2)}`] = 0.2
      }
    } else if (subupdate === 3) {
      // SUBUPDATE 3: Después de jugarse césped mixto
      if (modality === 'grass_mixed') {
        // Césped mixto: actual*1, prev*0.8, prev2*0.5, prev3*0.2
        config[modality][currentSeason] = 1.0
        config[modality][`${currentYear - 1}-${(currentYear).toString().slice(-2)}`] = 0.8
        config[modality][`${currentYear - 2}-${(currentYear - 1).toString().slice(-2)}`] = 0.5
        config[modality][`${currentYear - 3}-${(currentYear - 2).toString().slice(-2)}`] = 0.2
      } else if (modality === 'beach_mixed' || modality === 'beach_open' || modality === 'beach_women') {
        // Playa (ya jugadas): actual*1, prev*0.8
        config[modality][currentSeason] = 1.0
        config[modality][`${currentYear - 1}-${(currentYear).toString().slice(-2)}`] = 0.8
      } else if (modality === 'grass_open' || modality === 'grass_women') {
        // Césped open/women: prev*1, prev2*0.8
        config[modality][`${currentYear - 1}-${(currentYear).toString().slice(-2)}`] = 1.0
        config[modality][`${currentYear - 2}-${(currentYear - 1).toString().slice(-2)}`] = 0.8
      }
    } else if (subupdate === 4) {
      // SUBUPDATE 4: Final de temporada
      // Todas las modalidades: actual*1, prev*0.8, prev2*0.5, prev3*0.2
      config[modality][currentSeason] = 1.0
      config[modality][`${currentYear - 1}-${(currentYear).toString().slice(-2)}`] = 0.8
      config[modality][`${currentYear - 2}-${(currentYear - 1).toString().slice(-2)}`] = 0.5
      config[modality][`${currentYear - 3}-${(currentYear - 2).toString().slice(-2)}`] = 0.2
    }
  })
  
  return config
}

/**
 * Calcular puntos ponderados para una modalidad según subtemporada
 */
export const calculateWeightedPoints = async (
  teamId: string,
  modality: string,
  subupdate: 1 | 2 | 3 | 4,
  currentSeason: string,
  supabase: any
): Promise<number> => {
  const coefficients = getCoefficientsForSubupdate(subupdate, currentSeason)
  const modalityCoeffs = coefficients[modality]
  
  if (!modalityCoeffs) return 0
  
  let totalPoints = 0
  
  for (const [season, coeff] of Object.entries(modalityCoeffs)) {
    // Obtener puntos base de esa temporada y modalidad
    const { data } = await supabase
      .from('team_season_points')
      .select(`${modality}_points`)
      .eq('team_id', teamId)
      .eq('season', season)
      .single()
    
    if (data && data[`${modality}_points`]) {
      totalPoints += data[`${modality}_points`] * coeff
    }
  }
  
  return totalPoints
}
