// Utilidades de traducción para valores de la base de datos

export const translateSurface = (surface: string): string => {
  const translations: Record<string, string> = {
    'GRASS': 'Césped',
    'BEACH': 'Playa',
    'INDOOR': 'Indoor'
  }
  return translations[surface] || surface
}

export const translateModality = (modality: string): string => {
  const translations: Record<string, string> = {
    'OPEN': 'Open',
    'WOMEN': 'Women',
    'MIXED': 'Mixto'
  }
  return translations[modality] || modality
}

export const translateTournamentType = (type: string): string => {
  const translations: Record<string, string> = {
    'CE1': 'Campeonato España 1ª División',
    'CE2': 'Campeonato España 2ª División',
    'REGIONAL': 'Campeonato Regional'
  }
  return translations[type] || type
}

export const getStatusLabel = (isFinished: boolean): string => {
  return isFinished ? 'Finalizado' : 'En curso'
}

export const getStatusColor = (isFinished: boolean): string => {
  return isFinished ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
}


