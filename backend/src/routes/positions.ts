import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
import { asyncHandler, Errors } from '@/middleware/errorHandler'
import { authMiddleware } from '@/middleware/auth'
import { auditLog } from '@/middleware/audit'

const router = Router()

/**
 * GET /api/positions
 * Obtener todas las posiciones con filtros
 */
router.get('/', asyncHandler(async (req, res) => {
  const { 
    tournamentId, 
    teamId, 
    regionId, 
    search, 
    sortBy = 'position', 
    sortOrder = 'asc',
    limit = '50',
    offset = '0'
  } = req.query

  const where: any = {}

  if (tournamentId) {
    where.tournamentId = tournamentId as string
  }

  if (teamId) {
    where.teamId = teamId as string
  }

  if (regionId) {
    where.team = {
      regionId: regionId as string
    }
  }

  if (search) {
    where.OR = [
      { team: { name: { contains: search as string } } },
      { tournament: { name: { contains: search as string } } }
    ]
  }

  const orderBy: any = {}
  orderBy[sortBy as string] = sortOrder

  const positions = await prisma.position.findMany({
    where,
    include: {
      team: {
        select: {
          id: true,
          name: true,
          region: {
            select: {
              id: true,
              name: true,
              code: true,
              coefficient: true
            }
          }
        }
      },
      tournament: {
        select: {
          id: true,
          name: true,
          type: true,
          year: true,
          surface: true,
          modality: true
        }
      }
    },
    orderBy,
    take: Math.min(parseInt(limit as string), 100),
    skip: parseInt(offset as string)
  })

  const total = await prisma.position.count({ where })

  res.json({
    success: true,
    data: positions,
    pagination: {
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: positions.length === parseInt(limit as string)
    },
    message: 'Posiciones obtenidas exitosamente'
  })
}))

/**
 * GET /api/positions/:id
 * Obtener posición específica
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params

  const position = await prisma.position.findUnique({
    where: { id },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          region: {
            select: {
              id: true,
              name: true,
              code: true,
              coefficient: true
            }
          }
        }
      },
      tournament: {
        select: {
          id: true,
          name: true,
          type: true,
          year: true,
          surface: true,
          modality: true
        }
      }
    }
  })

  if (!position) {
    throw Errors.NOT_FOUND('Posición no encontrada')
  }

  res.json({
    success: true,
    data: position,
    message: 'Posición obtenida exitosamente'
  })
}))

/**
 * POST /api/positions
 * Crear nueva posición
 */
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { tournamentId, teamId, position } = req.body

  // Validaciones
  if (!tournamentId || !teamId || position === undefined) {
    throw Errors.BAD_REQUEST('Faltan campos requeridos')
  }

  // Verificar que el torneo existe
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      region: {
        select: {
          coefficient: true
        }
      }
    }
  })

  if (!tournament) {
    throw Errors.NOT_FOUND('Torneo no encontrado')
  }

  // Verificar que el equipo existe
  const team = await prisma.team.findUnique({
    where: { id: teamId }
  })

  if (!team) {
    throw Errors.NOT_FOUND('Equipo no encontrado')
  }

  // Verificar que no existe ya una posición para este equipo en este torneo
  const existingPosition = await prisma.position.findUnique({
    where: {
      teamId_tournamentId: {
        teamId,
        tournamentId
      }
    }
  })

  if (existingPosition) {
    throw Errors.CONFLICT('Ya existe una posición para este equipo en este torneo')
  }

  // Calcular puntos basados en la posición y el coeficiente de la región
  const region = await prisma.region.findUnique({
    where: { id: team.regionId }
  })

  const points = region ? calculatePoints(position, region.coefficient) : 0

  const newPosition = await prisma.position.create({
    data: {
      tournamentId,
      teamId,
      position: parseInt(position),
      points
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          region: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      },
      tournament: {
        select: {
          id: true,
          name: true,
          type: true,
          year: true
        }
      }
    }
  })

  // Log de auditoría
  auditLog(req, 'CREATE', 'Position', newPosition.id, {
    tournamentId,
    teamId,
    position,
    points
  })

  res.status(201).json({
    success: true,
    data: newPosition,
    message: 'Posición creada exitosamente'
  })
}))

/**
 * PUT /api/positions/:id
 * Actualizar posición
 */
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params
  const { position } = req.body

  if (position === undefined) {
    throw Errors.BAD_REQUEST('La posición es requerida')
  }

  const existingPosition = await prisma.position.findUnique({
    where: { id },
    include: {
      team: {
        select: {
          regionId: true
        }
      }
    }
  })

  if (!existingPosition) {
    throw Errors.NOT_FOUND('Posición no encontrada')
  }

  // Calcular nuevos puntos
  const region = await prisma.region.findUnique({
    where: { id: existingPosition.team.regionId }
  })

  const points = region ? calculatePoints(position, region.coefficient) : 0

  const updatedPosition = await prisma.position.update({
    where: { id },
    data: {
      position: parseInt(position),
      points
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          region: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      },
      tournament: {
        select: {
          id: true,
          name: true,
          type: true,
          year: true
        }
      }
    }
  })

  // Log de auditoría
  auditLog(req, 'UPDATE', 'Position', id, {
    position,
    points
  })

  res.json({
    success: true,
    data: updatedPosition,
    message: 'Posición actualizada exitosamente'
  })
}))

/**
 * DELETE /api/positions/:id
 * Eliminar posición
 */
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params

  const position = await prisma.position.findUnique({
    where: { id }
  })

  if (!position) {
    throw Errors.NOT_FOUND('Posición no encontrada')
  }

  await prisma.position.delete({
    where: { id }
  })

  // Log de auditoría
  auditLog(req, 'DELETE', 'Position', id)

  res.json({
    success: true,
    message: 'Posición eliminada exitosamente'
  })
}))

/**
 * Función para calcular puntos basados en posición y coeficiente
 */
function calculatePoints(position: number, coefficient: number): number {
  // Fórmula básica: puntos = (posición máxima - posición actual + 1) * coeficiente
  // Por ejemplo, si hay 16 equipos y el coeficiente es 1.5:
  // 1er lugar: (16 - 1 + 1) * 1.5 = 16 * 1.5 = 24 puntos
  // 2do lugar: (16 - 2 + 1) * 1.5 = 15 * 1.5 = 22.5 puntos
  
  // Por ahora usamos una fórmula simple, se puede ajustar según las reglas específicas
  const basePoints = Math.max(1, 20 - position + 1)
  return basePoints * coefficient
}

export default router
