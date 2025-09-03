import express from 'express'
import multer from 'multer'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '@/middleware/auth'
import { criticalOperationAudit } from '@/middleware/audit'
import Papa from 'papaparse'
import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'

const router = express.Router()
const prisma = new PrismaClient()

// Configuración de multer para subida de archivos
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Tipo de archivo no permitido'))
    }
  }
})

// Middleware de autenticación para todas las rutas
router.use(authenticateToken)

// POST /api/import/validate - Validar archivo de importación
router.post('/validate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó ningún archivo'
      })
    }

    const file = req.file
    let data: any[] = []
    let errors: string[] = []
    let warnings: string[] = []

    // Procesar archivo según su tipo
    if (file.mimetype === 'text/csv') {
      const csvText = file.buffer.toString('utf-8')
      const result = Papa.parse(csvText, { header: true })
      data = result.data as any[]
      
      if (result.errors.length > 0) {
        errors.push(`Errores en CSV: ${result.errors.map(e => e.message).join(', ')}`)
      }
    } else if (file.mimetype.includes('excel')) {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(file.buffer)
      
      const worksheet = workbook.getWorksheet(1)
      if (!worksheet) {
        return res.status(400).json({
          success: false,
          error: 'No se encontró ninguna hoja en el archivo Excel'
        })
      }

      const headers: string[] = []
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || ''
      })

      data = []
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Saltar la fila de encabezados
          const rowData: any = {}
          row.eachCell((cell, colNumber) => {
            rowData[headers[colNumber - 1]] = cell.value?.toString() || ''
          })
          data.push(rowData)
        }
      })
    }

    // Validar datos
    const validationResult = await validateImportData(data)
    
    res.json({
      success: true,
      data: validationResult
    })
  } catch (error: any) {
    console.error('Error validando archivo:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    })
  }
})

// POST /api/import - Importar datos
router.post('/', upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionaron archivos'
      })
    }

    const files = req.files as Express.Multer.File[]
    const options = req.body.options ? JSON.parse(req.body.options) : {}
    
    let importedData = {
      teams: 0,
      tournaments: 0,
      results: 0,
      errors: [] as string[]
    }

    for (const file of files) {
      try {
        const fileData = await processImportFile(file)
        const result = await importData(fileData, options)
        
        importedData.teams += result.teams
        importedData.tournaments += result.tournaments
        importedData.results += result.results
        importedData.errors.push(...result.errors)
      } catch (error: any) {
        importedData.errors.push(`Error procesando ${file.originalname}: ${error.message}`)
      }
    }

    // Registrar la operación en el log de auditoría
    await criticalOperationAudit(req, 'IMPORT_DATA', {
      files: files.map(f => f.originalname),
      importedData,
      options
    })

    res.json({
      success: true,
      message: 'Datos importados correctamente',
      data: importedData
    })
  } catch (error: any) {
    console.error('Error importando datos:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    })
  }
})

// POST /api/export - Exportar datos
router.post('/export', async (req, res) => {
  try {
    const { format, dataType, dateRange, includeHistory, includeStats, compress } = req.body

    let data: any = {}
    
    // Obtener datos según el tipo solicitado
    switch (dataType) {
      case 'teams':
        data.teams = await prisma.team.findMany({
          include: { region: true }
        })
        break
      
      case 'tournaments':
        data.tournaments = await prisma.tournament.findMany({
          include: { region: true }
        })
        break
      
      case 'results':
        data.results = await prisma.position.findMany({
          include: {
            team: true,
            tournament: true
          }
        })
        break
      
      case 'ranking':
        data.ranking = await prisma.rankingHistory.findMany({
          include: { team: true },
          orderBy: { rank: 'asc' }
        })
        break
      
      case 'all':
      default:
        data.teams = await prisma.team.findMany({ include: { region: true } })
        data.tournaments = await prisma.tournament.findMany({ include: { region: true } })
        data.results = await prisma.position.findMany({
          include: { team: true, tournament: true }
        })
        data.ranking = await prisma.rankingHistory.findMany({
          include: { team: true },
          orderBy: { rank: 'asc' }
        })
        data.regions = await prisma.region.findMany()
        break
    }

    // Aplicar filtros de fecha si se especifican
    if (dateRange?.start && dateRange?.end) {
      // Implementar filtros de fecha según el tipo de datos
    }

    // Incluir historial si se solicita
    if (includeHistory) {
      data.rankingHistory = await prisma.rankingHistory.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    }

    // Incluir estadísticas si se solicita
    if (includeStats) {
      data.stats = await getSystemStats()
    }

    let buffer: Buffer
    let filename: string
    let contentType: string

    // Generar archivo según el formato
    switch (format) {
      case 'excel':
        const workbook = new ExcelJS.Workbook()
        
        // Crear hojas para cada tipo de datos
        if (data.teams) {
          const teamsSheet = workbook.addWorksheet('Equipos')
          teamsSheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nombre', key: 'name', width: 30 },
            { header: 'Club', key: 'club', width: 30 },
            { header: 'Región', key: 'region', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Creado', key: 'createdAt', width: 20 }
          ]
          data.teams.forEach((team: any) => {
            teamsSheet.addRow({
              id: team.id,
              name: team.name,
              club: team.club,
              region: team.region?.name || team.region,
              email: team.email,
              createdAt: new Date(team.createdAt).toLocaleDateString()
            })
          })
        }

        if (data.tournaments) {
          const tournamentsSheet = workbook.addWorksheet('Torneos')
          tournamentsSheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nombre', key: 'name', width: 30 },
            { header: 'Tipo', key: 'type', width: 15 },
            { header: 'Año', key: 'year', width: 10 },
            { header: 'Superficie', key: 'surface', width: 15 },
            { header: 'Modalidad', key: 'modality', width: 15 },
            { header: 'Región', key: 'region', width: 20 },
            { header: 'Estado', key: 'status', width: 15 }
          ]
          data.tournaments.forEach((tournament: any) => {
            tournamentsSheet.addRow({
              id: tournament.id,
              name: tournament.name,
              type: tournament.type,
              year: tournament.year,
              surface: tournament.surface,
              modality: tournament.modality,
              region: tournament.region?.name || tournament.region,
              status: tournament.status
            })
          })
        }

        if (data.ranking) {
          const rankingSheet = workbook.addWorksheet('Ranking')
          rankingSheet.columns = [
            { header: 'Posición', key: 'position', width: 10 },
            { header: 'Equipo', key: 'teamName', width: 30 },
            { header: 'Región', key: 'region', width: 20 },
            { header: 'Puntos', key: 'points', width: 15 },
            { header: 'Cambio', key: 'change', width: 10 },
            { header: 'Torneos', key: 'tournaments', width: 10 },
            { header: 'Última Actualización', key: 'lastUpdate', width: 20 }
          ]
          data.ranking.forEach((entry: any) => {
            rankingSheet.addRow({
              position: entry.position,
              teamName: entry.team?.name || entry.teamName,
              region: entry.team?.region?.name || entry.region,
              points: entry.points,
              change: entry.change,
              tournaments: entry.tournaments,
              lastUpdate: new Date(entry.lastUpdate).toLocaleDateString()
            })
          })
        }

        buffer = await workbook.xlsx.writeBuffer()
        filename = `ranking-fedv-export-${new Date().toISOString().split('T')[0]}.xlsx`
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break

      case 'csv':
        const csvData = convertToCSV(data)
        buffer = Buffer.from(csvData, 'utf-8')
        filename = `ranking-fedv-export-${new Date().toISOString().split('T')[0]}.csv`
        contentType = 'text/csv'
        break

      case 'json':
      default:
        buffer = Buffer.from(JSON.stringify(data, null, 2), 'utf-8')
        filename = `ranking-fedv-export-${new Date().toISOString().split('T')[0]}.json`
        contentType = 'application/json'
        break
    }

    // Registrar la operación en el log de auditoría
    await criticalOperationAudit(req, 'EXPORT_DATA', {
      format,
      dataType,
      dateRange,
      includeHistory,
      includeStats
    })

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  } catch (error: any) {
    console.error('Error exportando datos:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    })
  }
})

// Funciones auxiliares
async function validateImportData(data: any[]) {
  const errors: string[] = []
  const warnings: string[] = []
  const teams: any[] = []
  const tournaments: any[] = []
  const results: any[] = []

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const lineNumber = i + 2 // +2 porque empezamos después del header

    // Validar campos requeridos
    if (!row.name) {
      errors.push(`Línea ${lineNumber}: Nombre es requerido`)
      continue
    }

    // Detectar tipo de datos basado en las columnas
    if (row.club && row.region) {
      // Probablemente es un equipo
      if (!row.email || !isValidEmail(row.email)) {
        errors.push(`Línea ${lineNumber}: Email inválido`)
      }
      
      teams.push({
        name: row.name,
        club: row.club,
        region: row.region,
        email: row.email
      })
    } else if (row.type && row.year) {
      // Probablemente es un torneo
      tournaments.push({
        name: row.name,
        type: row.type,
        year: parseInt(row.year),
        surface: row.surface || 'GRASS',
        modality: row.modality || 'OPEN',
        region: row.region || 'Madrid'
      })
    } else if (row.position && row.points) {
      // Probablemente es un resultado
      results.push({
        tournament: row.tournament,
        team: row.team,
        position: parseInt(row.position),
        points: parseInt(row.points)
      })
    }
  }

  return { teams, tournaments, results, errors, warnings }
}

async function processImportFile(file: Express.Multer.File) {
  let data: any[] = []

  if (file.mimetype === 'text/csv') {
    const csvText = file.buffer.toString('utf-8')
    const result = Papa.parse(csvText, { header: true })
    data = result.data as any[]
  } else if (file.mimetype.includes('excel')) {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(file.buffer)
    
    const worksheet = workbook.getWorksheet(1)
    if (!worksheet) {
      throw new Error('No se encontró ninguna hoja en el archivo Excel')
    }

    const headers: string[] = []
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value?.toString() || ''
    })

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const rowData: any = {}
        row.eachCell((cell, colNumber) => {
          rowData[headers[colNumber - 1]] = cell.value?.toString() || ''
        })
        data.push(rowData)
      }
    })
  }

  return data
}

async function importData(data: any[], options: any) {
  const result = {
    teams: 0,
    tournaments: 0,
    results: 0,
    errors: [] as string[]
  }

  try {
    // Procesar equipos
    if (data.some(row => row.club && row.region)) {
      const teams = data.filter(row => row.club && row.region)
      
      for (const teamData of teams) {
        try {
          // Buscar región
          const region = await prisma.region.findFirst({
            where: { name: { contains: teamData.region, mode: 'insensitive' } }
          })

          if (!region) {
            result.errors.push(`Región no encontrada: "${teamData.region}"`)
            continue
          }

          // Crear o actualizar equipo
          if (options.mode === 'update') {
            await prisma.team.upsert({
              where: { name_regionId: { name: teamData.name, regionId: region.id } },
              update: {
                club: teamData.club,
                email: teamData.email
              },
              create: {
                name: teamData.name,
                club: teamData.club,
                regionId: region.id,
                email: teamData.email
              }
            })
          } else {
            await prisma.team.create({
              data: {
                name: teamData.name,
                club: teamData.club,
                regionId: region.id,
                email: teamData.email
              }
            })
          }
          
          result.teams++
        } catch (error: any) {
          result.errors.push(`Error creando equipo "${teamData.name}": ${error.message}`)
        }
      }
    }

    // Procesar torneos
    if (data.some(row => row.type && row.year)) {
      const tournaments = data.filter(row => row.type && row.year)
      
      for (const tournamentData of tournaments) {
        try {
          // Buscar región
          const region = await prisma.region.findFirst({
            where: { name: { contains: tournamentData.region, mode: 'insensitive' } }
          })

          if (!region) {
            result.errors.push(`Región no encontrada: "${tournamentData.region}"`)
            continue
          }

          await prisma.tournament.create({
            data: {
              name: tournamentData.name,
              type: tournamentData.type,
              year: parseInt(tournamentData.year),
              surface: tournamentData.surface,
              modality: tournamentData.modality,
              regionId: region.id,
              status: 'PLANNED'
            }
          })
          
          result.tournaments++
        } catch (error: any) {
          result.errors.push(`Error creando torneo "${tournamentData.name}": ${error.message}`)
        }
      }
    }

    // Procesar resultados
    if (data.some(row => row.position && row.points)) {
      const results = data.filter(row => row.position && row.points)
      
      for (const resultData of results) {
        try {
          // Buscar equipo y torneo
          const team = await prisma.team.findFirst({
            where: { name: { contains: resultData.team, mode: 'insensitive' } }
          })

          const tournament = await prisma.tournament.findFirst({
            where: { name: { contains: resultData.tournament, mode: 'insensitive' } }
          })

          if (!team) {
            result.errors.push(`Equipo no encontrado: "${resultData.team}"`)
            continue
          }

          if (!tournament) {
            result.errors.push(`Torneo no encontrado: "${resultData.tournament}"`)
            continue
          }

          await prisma.position.create({
            data: {
              tournamentId: tournament.id,
              teamId: team.id,
              position: parseInt(resultData.position)
            }
          })
          
          result.results++
        } catch (error: any) {
          result.errors.push(`Error creando resultado: ${error.message}`)
        }
      }
    }
  } catch (error: any) {
    result.errors.push(`Error general: ${error.message}`)
  }

  return result
}

function convertToCSV(data: any): string {
  const csvRows: string[] = []
  
  // Convertir cada tipo de datos a CSV
  if (data.teams) {
    csvRows.push('=== EQUIPOS ===')
    csvRows.push('Nombre,Club,Región,Email')
    data.teams.forEach((team: any) => {
      csvRows.push(`${team.name},${team.club},${team.region?.name || team.region},${team.email}`)
    })
    csvRows.push('')
  }

  if (data.tournaments) {
    csvRows.push('=== TORNEOS ===')
    csvRows.push('Nombre,Tipo,Año,Superficie,Modalidad,Región,Estado')
    data.tournaments.forEach((tournament: any) => {
      csvRows.push(`${tournament.name},${tournament.type},${tournament.year},${tournament.surface},${tournament.modality},${tournament.region?.name || tournament.region},${tournament.status}`)
    })
    csvRows.push('')
  }

  if (data.ranking) {
    csvRows.push('=== RANKING ===')
    csvRows.push('Posición,Equipo,Región,Puntos,Cambio,Torneos')
    data.ranking.forEach((entry: any) => {
      csvRows.push(`${entry.position},${entry.team?.name || entry.teamName},${entry.team?.region?.name || entry.region},${entry.points},${entry.change},${entry.tournaments}`)
    })
  }

  return csvRows.join('\n')
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

async function getSystemStats() {
  const [totalTeams, totalTournaments, totalRegions, totalPositions] = await Promise.all([
    prisma.team.count(),
    prisma.tournament.count(),
    prisma.region.count(),
    prisma.position.count()
  ])

  return {
    totalTeams,
    totalTournaments,
    totalRegions,
    totalPositions,
    exportDate: new Date().toISOString()
  }
}

export default router
