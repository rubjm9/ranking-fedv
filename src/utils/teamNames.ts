export type TeamModality = 'open' | 'women' | 'mixed'

export interface TeamNameSource {
  name?: string | null
  nameOpen?: string | null
  nameWomen?: string | null
  nameMixed?: string | null
  nombre_open?: string | null
  nombre_women?: string | null
  nombre_mixed?: string | null
}

/** Campos de nombre para joins de Supabase en rankings. */
export const TEAM_RANKING_NAME_SELECT =
  'name, nameOpen, nameWomen, nameMixed'

const getModalityFromCategory = (category?: string | null): TeamModality | null => {
  if (!category) return null
  if (category === 'open' || category.endsWith('_open')) return 'open'
  if (category === 'women' || category.endsWith('_women')) return 'women'
  if (category === 'mixed' || category.endsWith('_mixed')) return 'mixed'
  return null
}

export const inferModalityFromSurfaces = (surfaces: string[]): TeamModality | null => {
  if (surfaces.length === 0) return null

  const modalities = surfaces.map(surface => getModalityFromCategory(surface))
  if (modalities.some(modality => modality === null)) return null

  const unique = new Set(modalities)
  return unique.size === 1 ? (modalities[0] as TeamModality) : null
}

/**
 * Nombre a mostrar en un ranking según la modalidad.
 * Rankings generales o combinados sin modalidad única usan el nombre general.
 */
export const getTeamDisplayNameForCategory = (
  team: TeamNameSource | null | undefined,
  category?: string | null,
  surfaces?: string[]
): string => {
  const generalName = team?.name?.trim() || 'Equipo desconocido'
  if (!team) return generalName

  const modality =
    getModalityFromCategory(category) ?? inferModalityFromSurfaces(surfaces ?? [])

  if (!modality) return generalName

  const openName = (team.nameOpen ?? team.nombre_open)?.trim()
  const womenName = (team.nameWomen ?? team.nombre_women)?.trim()
  const mixedName = (team.nameMixed ?? team.nombre_mixed)?.trim()

  if (modality === 'open' && openName) return openName
  if (modality === 'women' && womenName) return womenName
  if (modality === 'mixed' && mixedName) return mixedName

  return generalName
}
