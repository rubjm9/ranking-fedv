import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { PrismaClient, TournamentType, Surface, Modality } from '@prisma/client';
import { asyncHandler, Errors } from '@/middleware/errorHandler';
import { authMiddleware } from '@/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validaciones para torneos
const createTournamentValidation = [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Nombre debe tener entre 2 y 200 caracteres'),
  body('type').isIn(['CE1', 'CE2', 'REGIONAL']).withMessage('Tipo de torneo inválido'),
  body('year').isInt({ min: 2020, max: 2030 }).withMessage('Año debe estar entre 2020 y 2030'),
  body('surface').isIn(['GRASS', 'BEACH', 'INDOOR']).withMessage('Superficie inválida'),
  body('modality').isIn(['OPEN', 'MIXED', 'WOMEN']).withMessage('Modalidad inválida'),
  body('regionId').optional().isString().withMessage('ID de región inválido'),
  body('startDate').optional().isISO8601().withMessage('Fecha de inicio inválida'),
  body('endDate').optional().isISO8601().withMessage('Fecha de fin inválida'),
  body('location').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Ubicación debe tener entre 2 y 200 caracteres')
];

const updateTournamentValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Nombre debe tener entre 2 y 200 caracteres'),
  body('type').optional().isIn(['CE1', 'CE2', 'REGIONAL']).withMessage('Tipo de torneo inválido'),
  body('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('Año debe estar entre 2020 y 2030'),
  body('surface').optional().isIn(['GRASS', 'BEACH', 'INDOOR']).withMessage('Superficie inválida'),
  body('modality').optional().isIn(['OPEN', 'MIXED', 'WOMEN']).withMessage('Modalidad inválida'),
  body('regionId').optional().isString().withMessage('ID de región inválido'),
  body('startDate').optional().isISO8601().withMessage('Fecha de inicio inválida'),
  body('endDate').optional().isISO8601().withMessage('Fecha de fin inválida'),
  body('location').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Ubicación debe tener entre 2 y 200 caracteres')
];

// Validaciones para posiciones
const createPositionsValidation = [
  body('tournamentId').isString().withMessage('ID de torneo requerido'),
  body('positions').isArray({ min: 1 }).withMessage('Se requiere al menos una posición'),
  body('positions.*.teamId').isString().withMessage('ID de equipo requerido'),
  body('positions.*.position').isInt({ min: 1 }).withMessage('Posición debe ser un número positivo')
];

/**
 * GET /api/tournaments
 * Obtener lista de torneos con filtros
 */
router.get('/', asyncHandler(async (req, res) => {
  const { 
    type, 
    year, 
    surface, 
    modality, 
    regionId,
    limit = 50, 
    offset = 0,
    sortBy = 'year',
    sortOrder = 'desc'
  } = req.query;

  const where: any = {};

  if (type) {
    where.type = type as TournamentType;
  }

  if (year) {
    where.year = parseInt(year as string);
  }

  if (surface) {
    where.surface = surface as Surface;
  }

  if (modality) {
    where.modality = modality as Modality;
  }

  if (regionId) {
    where.regionId = regionId as string;
  }

  const orderBy: any = {};
  orderBy[sortBy as string] = sortOrder;

  const tournaments = await prisma.tournament.findMany({
    where,
    include: {
      region: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      _count: {
        select: {
          positions: true
        }
      }
    },
    orderBy,
    take: Math.min(parseInt(limit as string), 100),
    skip: parseInt(offset as string)
  });

  const total = await prisma.tournament.count({ where });

  res.json({
    success: true,
    data: tournaments,
    pagination: {
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: tournaments.length === parseInt(limit as string)
    },
    message: 'Torneos obtenidos exitosamente'
  });
}));

/**
 * GET /api/tournaments/:id
 * Obtener torneo específico
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      region: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      positions: {
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
          }
        },
        orderBy: {
          position: 'asc'
        }
      }
    }
  });

  if (!tournament) {
    throw Errors.NOT_FOUND('Torneo no encontrado');
  }

  res.json({
    success: true,
    data: tournament,
    message: 'Torneo obtenido exitosamente'
  });
}));

/**
 * POST /api/tournaments
 * Crear nuevo torneo (protegido, solo admin)
 */
router.post('/', authMiddleware, createTournamentValidation, asyncHandler(async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.VALIDATION_ERROR(errors.array()[0].msg);
  }

  const { name, type, year, surface, modality, regionId } = req.body;

  // Verificar que no existe un torneo con el mismo nombre y año
  const existingTournament = await prisma.tournament.findFirst({
    where: {
      name,
      year
    }
  });

  if (existingTournament) {
    throw Errors.CONFLICT('Ya existe un torneo con ese nombre en ese año');
  }

  // Si se especifica región, verificar que existe
  if (regionId) {
    const region = await prisma.region.findUnique({
      where: { id: regionId }
    });

    if (!region) {
      throw Errors.BAD_REQUEST('Región no encontrada');
    }
  }

  const tournament = await prisma.tournament.create({
    data: {
      name,
      type,
      year,
      surface,
      modality,
      regionId
    },
    include: {
      region: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: tournament,
    message: 'Torneo creado exitosamente'
  });
}));

/**
 * PUT /api/tournaments/:id
 * Actualizar torneo (protegido, solo admin)
 */
router.put('/:id', authMiddleware, updateTournamentValidation, asyncHandler(async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.VALIDATION_ERROR(errors.array()[0].msg);
  }

  const { id } = req.params;
  const { name, type, year, surface, modality, regionId } = req.body;

  // Verificar que el torneo existe
  const existingTournament = await prisma.tournament.findUnique({
    where: { id }
  });

  if (!existingTournament) {
    throw Errors.NOT_FOUND('Torneo no encontrado');
  }

  // Verificar conflictos de nombre y año
  if (name || year) {
    const conflict = await prisma.tournament.findFirst({
      where: {
        name: name || existingTournament.name,
        year: year || existingTournament.year,
        id: { not: id }
      }
    });

    if (conflict) {
      throw Errors.CONFLICT('Ya existe un torneo con ese nombre en ese año');
    }
  }

  // Si se especifica región, verificar que existe
  if (regionId) {
    const region = await prisma.region.findUnique({
      where: { id: regionId }
    });

    if (!region) {
      throw Errors.BAD_REQUEST('Región no encontrada');
    }
  }

  const tournament = await prisma.tournament.update({
    where: { id },
    data: {
      name,
      type,
      year,
      surface,
      modality,
      regionId
    },
    include: {
      region: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: tournament,
    message: 'Torneo actualizado exitosamente'
  });
}));

/**
 * DELETE /api/tournaments/:id
 * Eliminar torneo (protegido, solo admin)
 */
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar que el torneo existe
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      positions: true
    }
  });

  if (!tournament) {
    throw Errors.NOT_FOUND('Torneo no encontrado');
  }

  // Verificar que no tiene posiciones asociadas
  if (tournament.positions.length > 0) {
    throw Errors.CONFLICT('No se puede eliminar un torneo que tiene posiciones registradas');
  }

  await prisma.tournament.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Torneo eliminado exitosamente'
  });
}));

/**
 * POST /api/tournaments/:id/positions
 * Añadir posiciones a un torneo (protegido, solo admin)
 */
router.post('/:id/positions', authMiddleware, createPositionsValidation, asyncHandler(async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.VALIDATION_ERROR(errors.array()[0].msg);
  }

  const { id } = req.params;
  const { positions } = req.body;

  // Verificar que el torneo existe
  const tournament = await prisma.tournament.findUnique({
    where: { id }
  });

  if (!tournament) {
    throw Errors.NOT_FOUND('Torneo no encontrado');
  }

  // Verificar que no hay posiciones duplicadas
  const positionNumbers = positions.map((p: any) => p.position);
  const uniquePositions = new Set(positionNumbers);
  
  if (uniquePositions.size !== positionNumbers.length) {
    throw Errors.BAD_REQUEST('No puede haber posiciones duplicadas');
  }

  // Verificar que todos los equipos existen
  const teamIds = positions.map((p: any) => p.teamId);
  const teams = await prisma.team.findMany({
    where: {
      id: { in: teamIds }
    }
  });

  if (teams.length !== teamIds.length) {
    throw Errors.BAD_REQUEST('Algunos equipos no existen');
  }

  // Eliminar posiciones existentes del torneo
  await prisma.position.deleteMany({
    where: { tournamentId: id }
  });

  // Crear nuevas posiciones
  const positionData = positions.map((p: any) => ({
    tournamentId: id,
    teamId: p.teamId,
    position: p.position
  }));

  await prisma.position.createMany({
    data: positionData
  });

  // Obtener las posiciones creadas
  const createdPositions = await prisma.position.findMany({
    where: { tournamentId: id },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          club: true,
          region: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      }
    },
    orderBy: {
      position: 'asc'
    }
  });

  res.json({
    success: true,
    data: {
      tournamentId: id,
      positions: createdPositions,
      totalPositions: createdPositions.length
    },
    message: 'Posiciones añadidas exitosamente'
  });
}));

/**
 * GET /api/tournaments/:id/positions
 * Obtener posiciones de un torneo
 */
router.get('/:id/positions', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      positions: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              club: true,
              region: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          }
        },
        orderBy: {
          position: 'asc'
        }
      }
    }
  });

  if (!tournament) {
    throw Errors.NOT_FOUND('Torneo no encontrado');
  }

  res.json({
    success: true,
    data: {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        type: tournament.type,
        year: tournament.year,
        surface: tournament.surface,
        modality: tournament.modality
      },
      positions: tournament.positions
    },
    message: 'Posiciones del torneo obtenidas exitosamente'
  });
}));

/**
 * GET /api/tournaments/:id/stats
 * Obtener estadísticas de un torneo
 */
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      region: true,
      positions: {
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
          }
        }
      }
    }
  });

  if (!tournament) {
    throw Errors.NOT_FOUND('Torneo no encontrado');
  }

  // Calcular estadísticas
  const totalTeams = tournament.positions.length;
  
  const teamsByRegion = tournament.positions.reduce((acc, pos) => {
    const regionName = pos.team.region.name;
    acc[regionName] = (acc[regionName] || 0) + 1;
    return acc;
  }, {} as any);

  const regionBreakdown = Object.entries(teamsByRegion).map(([name, count]) => ({
    regionName: name,
    teamCount: count
  }));

  const stats = {
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    type: tournament.type,
    year: tournament.year,
    surface: tournament.surface,
    modality: tournament.modality,
    region: tournament.region ? {
      id: tournament.region.id,
      name: tournament.region.name
    } : null,
    totalTeams,
    regionBreakdown
  };

  res.json({
    success: true,
    data: stats,
    message: 'Estadísticas del torneo obtenidas exitosamente'
  });
}));

/**
 * DELETE /api/tournaments/:id/positions
 * Eliminar todas las posiciones de un torneo (protegido, solo admin)
 */
router.delete('/:id/positions', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar que el torneo existe
  const tournament = await prisma.tournament.findUnique({
    where: { id }
  });

  if (!tournament) {
    throw Errors.NOT_FOUND('Torneo no encontrado');
  }

  // Eliminar todas las posiciones del torneo
  const deletedCount = await prisma.position.deleteMany({
    where: { tournamentId: id }
  });

  res.json({
    success: true,
    data: {
      tournamentId: id,
      deletedPositions: deletedCount.count
    },
    message: `Se eliminaron ${deletedCount.count} posiciones del torneo`
  });
}));

export default router;
