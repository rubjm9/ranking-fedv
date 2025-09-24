import * as XLSX from 'xlsx'
import { tournamentsService, teamsService, regionsService } from './apiService'
import { getPointsForPosition } from '@/utils/tournamentUtils'

export interface TournamentImportRow {
  // Información del torneo
  nombre: string
  tipo: string
  temporada: string
  superficie: string
  modalidad: string
  region?: string
  fecha_inicio: string
  fecha_fin: string
  ubicacion: string
  
  // Posiciones (1-30 para cubrir torneos regionales)
  posicion_1?: string
  posicion_2?: string
  posicion_3?: string
  posicion_4?: string
  posicion_5?: string
  posicion_6?: string
  posicion_7?: string
  posicion_8?: string
  posicion_9?: string
  posicion_10?: string
  posicion_11?: string
  posicion_12?: string
  posicion_13?: string
  posicion_14?: string
  posicion_15?: string
  posicion_16?: string
  posicion_17?: string
  posicion_18?: string
  posicion_19?: string
  posicion_20?: string
  posicion_21?: string
  posicion_22?: string
  posicion_23?: string
  posicion_24?: string
  posicion_25?: string
  posicion_26?: string
  posicion_27?: string
  posicion_28?: string
  posicion_29?: string
  posicion_30?: string
}

export interface ImportResult {
  success: boolean
  message: string
  data?: {
    tournamentsCreated: number
    positionsCreated: number
    errors: string[]
  }
}

export const tournamentImportService = {
  // Generar plantilla de importación
  generateTemplate: () => {
    // Headers para información de torneos + posiciones
    const headers = [
      'nombre',
      'tipo',
      'temporada', 
      'superficie',
      'modalidad',
      'region',
      'fecha_inicio',
      'fecha_fin',
      'ubicacion',
      'posicion_1',
      'posicion_2',
      'posicion_3',
      'posicion_4',
      'posicion_5',
      'posicion_6',
      'posicion_7',
      'posicion_8',
      'posicion_9',
      'posicion_10',
      'posicion_11',
      'posicion_12',
      'posicion_13',
      'posicion_14',
      'posicion_15',
      'posicion_16',
      'posicion_17',
      'posicion_18',
      'posicion_19',
      'posicion_20',
      'posicion_21',
      'posicion_22',
      'posicion_23',
      'posicion_24',
      'posicion_25',
      'posicion_26',
      'posicion_27',
      'posicion_28',
      'posicion_29',
      'posicion_30'
    ]

    // Datos de ejemplo para múltiples torneos (columnas)
    const exampleData = [
      // Torneo 1
      [
        'CE1 Playa Mixto 2024-25',
        'CE1',
        '2024-25',
        'BEACH',
        'MIXED',
        '',
        '2024-11-23',
        '2024-11-24',
        'Castelldefels, Barcelona',
        'Sharks',
        'Guayota',
        'Murciélagos',
        'Bravas',
        'PXT',
        'Murciélagos B',
        'Disctèrics',
        'Corocotta',
        'Diskolaris',
        'Guayota B',
        'Sharks B',
        'Frisbillanas',
        'Discachos',
        'Disctintos',
        'Jumanji',
        'Polbo',
        '', // posiciones 17-30 vacías para CE1
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ],
      // Torneo 2
      [
        'CE2 Playa Mixto 2024-25',
        'CE2',
        '2024-25',
        'BEACH',
        'MIXED',
        '',
        '2024-12-14',
        '2024-12-15',
        'Valencia',
        'Quijotes y Dulcineas',
        'Egara',
        'Bárbaros y Vikingas',
        'Zierzo',
        'Esperit',
        'Disckatus',
        'Urracas',
        'Dimonis',
        'Murciélagos C',
        'Camaleones',
        'Voltaris',
        'Ultimátum',
        'Volaores',
        'Cidbee',
        'DV Madrid',
        'Granayd',
        '', // posiciones 17-30 vacías para CE2
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ]
    ]

    // Crear worksheet con headers como primera fila
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...exampleData])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Torneos')

    // Generar archivo
    XLSX.writeFile(workbook, 'plantilla-importacion-torneos.xlsx')
  },

  // Parsear archivo Excel
  parseImportFile: async (file: File): Promise<TournamentImportRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Leer la primera hoja
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // Convertir a JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          
          // Saltar la primera fila (headers) y convertir a objetos
          const headers = jsonData[0] as string[]
          const rows = jsonData.slice(1) as any[][]
          
          console.log('Headers encontrados:', headers)
          console.log('Primera fila de datos:', rows[0])
          
          const tournaments: TournamentImportRow[] = rows
            .filter(row => row && row.length > 0) // Filtrar filas vacías
            .map(row => {
              const tournament: any = {}
              headers.forEach((header, index) => {
                const value = row[index]
                // Convertir valores vacíos a string vacío
                tournament[header] = value === undefined || value === null ? '' : String(value).trim()
              })
              return tournament as TournamentImportRow
            })
          
          console.log('Torneos parseados:', tournaments)
          resolve(tournaments)
        } catch (error) {
          console.error('Error al parsear archivo:', error)
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'))
      reader.readAsArrayBuffer(file)
    })
  },

  // Validar datos de importación
  validateImportData: async (data: TournamentImportRow[]): Promise<{ isValid: boolean; errors: string[] }> => {
    const errors: string[] = []
    
    // Campos requeridos
    const requiredFields = [
      'nombre', 'tipo', 'temporada', 'superficie', 'modalidad', 
      'fecha_inicio', 'fecha_fin', 'ubicacion'
    ]
    
    // Obtener todos los equipos para validar nombres
    const teamsResponse = await teamsService.getAll()
    const teams = teamsResponse.data || []
    const teamNameToId = new Map(teams.map(team => [team.name.toLowerCase(), team.id]))

    // Obtener todas las regiones para validar nombres
    const regionsResponse = await regionsService.getAll()
    const regions = regionsResponse.data || []
    const regionNameToId = new Map(regions.map((region: any) => [region.name.toLowerCase(), region.id]))
    
    data.forEach((row, index) => {
      const rowNumber = index + 2 // +2 porque Excel empieza en 1 y la fila 1 son headers
      
      // Verificar campos requeridos
      requiredFields.forEach(field => {
        const value = row[field as keyof TournamentImportRow]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push(`Fila ${rowNumber}: Campo '${field}' es requerido`)
        }
      })

      // Validar valores específicos
      if (row.tipo && !['CE1', 'CE2', 'REGIONAL'].includes(row.tipo)) {
        errors.push(`Fila ${rowNumber}: Tipo de torneo '${row.tipo}' no es válido. Valores válidos: CE1, CE2, REGIONAL`)
      }

      if (row.superficie && !['GRASS', 'BEACH', 'INDOOR'].includes(row.superficie)) {
        errors.push(`Fila ${rowNumber}: Superficie '${row.superficie}' no es válida. Valores válidos: GRASS, BEACH, INDOOR`)
      }

      if (row.modalidad && !['OPEN', 'MIXED', 'WOMEN'].includes(row.modalidad)) {
        errors.push(`Fila ${rowNumber}: Modalidad '${row.modalidad}' no es válida. Valores válidos: OPEN, MIXED, WOMEN`)
      }

      // Validar fechas
      if (row.fecha_inicio && row.fecha_fin) {
        const startDate = new Date(row.fecha_inicio)
        const endDate = new Date(row.fecha_fin)
        
        if (isNaN(startDate.getTime())) {
          errors.push(`Fila ${rowNumber}: Fecha de inicio '${row.fecha_inicio}' no es válida`)
        }
        
        if (isNaN(endDate.getTime())) {
          errors.push(`Fila ${rowNumber}: Fecha de fin '${row.fecha_fin}' no es válida`)
        }
        
        if (startDate > endDate) {
          errors.push(`Fila ${rowNumber}: La fecha de inicio no puede ser posterior a la fecha de fin`)
        }
      }

      // Validar temporada (formato YYYY-YY)
      if (row.temporada && !/^\d{4}-\d{2}$/.test(row.temporada)) {
        errors.push(`Fila ${rowNumber}: Temporada '${row.temporada}' debe tener formato YYYY-YY (ej: 2024-25)`)
      }

      // Para torneos regionales, región es requerida
      if (row.tipo === 'REGIONAL' && (!row.region || row.region.trim() === '')) {
        errors.push(`Fila ${rowNumber}: La región es requerida para torneos regionales`)
      } else if (row.tipo === 'REGIONAL' && row.region && !regionNameToId.has(row.region.toLowerCase())) {
        errors.push(`Fila ${rowNumber}: Región '${row.region}' no encontrada en la base de datos`)
      }

      // Validar equipos en posiciones
      const missingTeams: string[] = []
      for (let i = 1; i <= 30; i++) {
        const teamName = row[`posicion_${i}` as keyof TournamentImportRow] as string
        if (teamName && teamName.trim() !== '' && !teamNameToId.has(teamName.toLowerCase())) {
          missingTeams.push(`Posición ${i}: '${teamName}'`)
        }
      }
      
      if (missingTeams.length > 0) {
        errors.push(`Fila ${rowNumber}: Equipos no encontrados en la base de datos: ${missingTeams.join(', ')}`)
      }
    })
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Importar torneos
  importTournaments: async (data: TournamentImportRow[]): Promise<ImportResult> => {
    try {
      const validation = await tournamentImportService.validateImportData(data)
      
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Datos de importación inválidos',
          data: {
            tournamentsCreated: 0,
            positionsCreated: 0,
            errors: validation.errors
          }
        }
      }

      let tournamentsCreated = 0
      let positionsCreated = 0
      const errors: string[] = []

      // Obtener todos los equipos para mapear nombres a IDs
      const teamsResponse = await teamsService.getAll()
      const teams = teamsResponse.data || []
      const teamNameToId = new Map(teams.map(team => [team.name.toLowerCase(), team.id]))

      // Obtener todas las regiones para mapear nombres a IDs
      const regionsResponse = await regionsService.getAll()
      const regions = regionsResponse.data || []
      const regionNameToId = new Map(regions.map((region: any) => [region.name.toLowerCase(), region.id]))

      for (const row of data) {
        try {
          // Convertir temporada a año
          const year = parseInt(row.temporada.split('-')[0])
          
          // Crear torneo
          const tournamentData = {
            name: row.nombre,
            type: row.tipo,
            year: year,
            surface: row.superficie,
            modality: row.modalidad,
            regionId: row.tipo === 'REGIONAL' && row.region ? 
              regionNameToId.get(row.region.toLowerCase()) || null : null,
            startDate: row.fecha_inicio ? new Date(row.fecha_inicio).toISOString() : null,
            endDate: row.fecha_fin ? new Date(row.fecha_fin).toISOString() : null,
            location: row.ubicacion
          }

          const tournamentResponse = await tournamentsService.create(tournamentData)
          const tournamentId = tournamentResponse.data.id
          tournamentsCreated++

          // Crear posiciones (hasta 30 para torneos regionales)
          const positions = []
          const missingTeams: string[] = []
          
          for (let i = 1; i <= 30; i++) {
            const teamName = row[`posicion_${i}` as keyof TournamentImportRow] as string
            if (teamName && teamName.trim() !== '') {
              const teamId = teamNameToId.get(teamName.toLowerCase())
              if (teamId) {
                positions.push({
                  tournamentId: tournamentId,
                  teamId: teamId,
                  position: i,
                  points: getPointsForPosition(i, row.tipo)
                })
              } else {
                missingTeams.push(`Posición ${i}: '${teamName}'`)
                errors.push(`Torneo '${row.nombre}' - Equipo '${teamName}' en posición ${i} no encontrado en la base de datos`)
              }
            }
          }

          // Si hay equipos faltantes, agregar advertencia específica
          if (missingTeams.length > 0) {
            errors.push(`Torneo '${row.nombre}' - Equipos no encontrados: ${missingTeams.join(', ')}`)
          }

          // Crear posiciones en lote
          if (positions.length > 0) {
            await tournamentsService.addPositions(tournamentId, positions)
            positionsCreated += positions.length
          }

        } catch (error) {
          console.error('Error al crear torneo:', error)
          errors.push(`Error al crear torneo '${row.nombre}': ${error}`)
        }
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `Importación completada: ${tournamentsCreated} torneo(s) creado(s), ${positionsCreated} posiciones creadas`
          : `Importación completada con advertencias: ${tournamentsCreated} torneo(s) creado(s), ${positionsCreated} posiciones creadas. ${errors.length} advertencia(s)`,
        data: {
          tournamentsCreated,
          positionsCreated,
          errors
        }
      }

    } catch (error) {
      console.error('Error en importación:', error)
      return {
        success: false,
        message: 'Error durante la importación',
        data: {
          tournamentsCreated: 0,
          positionsCreated: 0,
          errors: [String(error)]
        }
      }
    }
  }
}
