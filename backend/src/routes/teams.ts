import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, Errors } from '@/middleware/errorHandler';
import { authMiddleware } from '@/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validaciones para equipos
const createTeamValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('regionId').isString().withMessage('ID de región requerido'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Email inválido'),
  body('logo').optional().isURL().withMessage('Logo debe ser una URL válida'),
  body('isFilial').optional().isBoolean().withMessage('isFilial debe ser un booleano'),
  body('parentTeamId').optional().isString().withMessage('parentTeamId debe ser un string'),
  body('hasDifferentNames').optional().isBoolean().withMessage('hasDifferentNames debe ser un booleano'),
  body('nameOpen').optional().trim().isLength({ max: 100 }).withMessage('Nombre Open debe tener máximo 100 caracteres'),
  body('nameWomen').optional().trim().isLength({ max: 100 }).withMessage('Nombre Women debe tener máximo 100 caracteres'),
  body('nameMixed').optional().trim().isLength({ max: 100 }).withMessage('Nombre Mixed debe tener máximo 100 caracteres')
];

const updateTeamValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('regionId').optional().isString().withMessage('ID de región inválido'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Email inválido'),
  body('logo').optional().isURL().withMessage('Logo debe ser una URL válida'),
  body('isFilial').optional().isBoolean().withMessage('isFilial debe ser un booleano'),
  body('parentTeamId').optional().isString().withMessage('parentTeamId debe ser un string'),
  body('hasDifferentNames').optional().isBoolean().withMessage('hasDifferentNames debe ser un booleano'),
  body('nameOpen').optional().trim().isLength({ max: 100 }).withMessage('Nombre Open debe tener máximo 100 caracteres'),
  body('nameWomen').optional().trim().isLength({ max: 100 }).withMessage('Nombre Women debe tener máximo 100 caracteres'),
  body('nameMixed').optional().trim().isLength({ max: 100 }).withMessage('Nombre Mixed debe tener máximo 100 caracteres')
];

/**
 * GET /api/teams
 * Obtener lista de equipos con filtros opcionales
 */
router.get('/', asyncHandler(async (req, res) => {
  const { 
    regionId, 
    search, 
    limit = 50, 
    offset = 0,
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;

  const where: any = {};

  if (regionId) {
    where.regionId = regionId as string;
  }

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { nameOpen: { contains: search as string, mode: 'insensitive' } },
      { nameWomen: { contains: search as string, mode: 'insensitive' } },
      { nameMixed: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const orderBy: any = {};
  orderBy[sortBy as string] = sortOrder;

  const teams = await prisma.team.findMany({
    where,
    include: {
      region: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      parentTeam: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy,
    take: Math.min(parseInt(limit as string), 100),
    skip: parseInt(offset as string)
  });

  const total = await prisma.team.count({ where });

  res.json({
    success: true,
    data: teams,
    pagination: {
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: teams.length === parseInt(limit as string)
    },
    message: 'Equipos obtenidos exitosamente'
  });
}));

/**
 * GET /api/teams/:id
 * Obtener equipo específico
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      region: {
        select: {
          id: true,
          name: true,
          code: true,
          coefficient: true
        }
      },
      parentTeam: {
        select: {
          id: true,
          name: true
        }
      },
      filialTeams: {
        select: {
          id: true,
          name: true
        }
      },
      positions: {
        include: {
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
        orderBy: {
          tournament: {
            year: 'desc'
          }
        }
      }
    }
  });

  if (!team) {
    throw Errors.NOT_FOUND('Equipo no encontrado');
  }

  res.json({
    success: true,
    data: team,
    message: 'Equipo obtenido exitosamente'
  });
}));

/**
 * POST /api/teams
 * Crear nuevo equipo (protegido, solo admin)
 */
router.post('/', authMiddleware, createTeamValidation, asyncHandler(async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.VALIDATION_ERROR(errors.array()[0].msg);
  }

  const { 
    name, 
    regionId, 
    email, 
    logo, 
    isFilial, 
    parentTeamId, 
    hasDifferentNames, 
    nameOpen, 
    nameWomen, 
    nameMixed 
  } = req.body;

  // Verificar que la región existe
  const region = await prisma.region.findUnique({
    where: { id: regionId }
  });

  if (!region) {
    throw Errors.BAD_REQUEST('Región no encontrada');
  }

  // Verificar que no existe un equipo con el mismo nombre en la misma región
  const existingTeam = await prisma.team.findFirst({
    where: {
      name,
      regionId
    }
  });

  if (existingTeam) {
    throw Errors.CONFLICT('Ya existe un equipo con ese nombre en esta región');
  }

  // Si es un equipo filial, verificar que el equipo padre existe
  if (isFilial && parentTeamId) {
    const parentTeam = await prisma.team.findUnique({
      where: { id: parentTeamId }
    });

    if (!parentTeam) {
      throw Errors.BAD_REQUEST('El equipo padre especificado no existe');
    }

    if (parentTeam.isFilial) {
      throw Errors.BAD_REQUEST('Un equipo filial no puede ser padre de otro equipo filial');
    }
  }

  const team = await prisma.team.create({
    data: {
      name,
      regionId,
      email,
      logo,
      isFilial: isFilial || false,
      parentTeamId: isFilial ? parentTeamId : null,
      hasDifferentNames: hasDifferentNames || false,
      nameOpen: hasDifferentNames ? nameOpen : null,
      nameWomen: hasDifferentNames ? nameWomen : null,
      nameMixed: hasDifferentNames ? nameMixed : null
    },
    include: {
      region: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      parentTeam: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: team,
    message: 'Equipo creado exitosamente'
  });
}));

/**
 * PUT /api/teams/:id
 * Actualizar equipo (protegido, solo admin)
 */
router.put('/:id', authMiddleware, updateTeamValidation, asyncHandler(async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.VALIDATION_ERROR(errors.array()[0].msg);
  }

  const { id } = req.params;
  const { 
    name, 
    regionId, 
    email, 
    logo, 
    isFilial, 
    parentTeamId, 
    hasDifferentNames, 
    nameOpen, 
    nameWomen, 
    nameMixed 
  } = req.body;

  // Verificar que el equipo existe
  const existingTeam = await prisma.team.findUnique({
    where: { id }
  });

  if (!existingTeam) {
    throw Errors.NOT_FOUND('Equipo no encontrado');
  }

  // Si se está cambiando la región, verificar que existe
  if (regionId && regionId !== existingTeam.regionId) {
    const region = await prisma.region.findUnique({
      where: { id: regionId }
    });

    if (!region) {
      throw Errors.BAD_REQUEST('Región no encontrada');
    }
  }

  // Si se está cambiando el nombre, verificar que no hay conflicto
  if (name && name !== existingTeam.name) {
    const nameConflict = await prisma.team.findFirst({
      where: {
        name,
        regionId: regionId || existingTeam.regionId,
        id: { not: id }
      }
    });

    if (nameConflict) {
      throw Errors.CONFLICT('Ya existe un equipo con ese nombre en esta región');
    }
  }

  // Si se está cambiando a equipo filial, verificar que el equipo padre existe
  if (isFilial && parentTeamId) {
    const parentTeam = await prisma.team.findUnique({
      where: { id: parentTeamId }
    });

    if (!parentTeam) {
      throw Errors.BAD_REQUEST('El equipo padre especificado no existe');
    }

    if (parentTeam.isFilial) {
      throw Errors.BAD_REQUEST('Un equipo filial no puede ser padre de otro equipo filial');
    }

    if (parentTeamId === id) {
      throw Errors.BAD_REQUEST('Un equipo no puede ser padre de sí mismo');
    }
  }

  const team = await prisma.team.update({
    where: { id },
    data: {
      name,
      regionId,
      email,
      logo,
      isFilial: isFilial !== undefined ? isFilial : existingTeam.isFilial,
      parentTeamId: isFilial ? parentTeamId : null,
      hasDifferentNames: hasDifferentNames !== undefined ? hasDifferentNames : existingTeam.hasDifferentNames,
      nameOpen: hasDifferentNames ? nameOpen : null,
      nameWomen: hasDifferentNames ? nameWomen : null,
      nameMixed: hasDifferentNames ? nameMixed : null
    },
    include: {
      region: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      parentTeam: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: team,
    message: 'Equipo actualizado exitosamente'
  });
}));

/**
 * DELETE /api/teams/:id
 * Eliminar equipo (protegido, solo admin)
 */
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar que el equipo existe
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      positions: true
    }
  });

  if (!team) {
    throw Errors.NOT_FOUND('Equipo no encontrado');
  }

  // Verificar que no tiene posiciones asociadas
  if (team.positions.length > 0) {
    throw Errors.CONFLICT('No se puede eliminar un equipo que tiene posiciones en torneos');
  }

  // Verificar que no tiene equipos filiales
  const filialTeams = await prisma.team.findMany({
    where: { parentTeamId: id }
  });

  if (filialTeams.length > 0) {
    throw Errors.CONFLICT('No se puede eliminar un equipo que tiene equipos filiales asociados');
  }

  await prisma.team.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Equipo eliminado exitosamente'
  });
}));

/**
 * GET /api/teams/:id/positions
 * Obtener posiciones de un equipo
 */
router.get('/:id/positions', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { year, tournamentType } = req.query;

  const where: any = {
    teamId: id
  };

  if (year) {
    where.tournament = {
      year: parseInt(year as string)
    };
  }

  if (tournamentType) {
    where.tournament = {
      ...where.tournament,
      type: tournamentType
    };
  }

  const positions = await prisma.position.findMany({
    where,
    include: {
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
    orderBy: {
      tournament: {
        year: 'desc'
      }
    }
  });

  res.json({
    success: true,
    data: positions,
    message: 'Posiciones del equipo obtenidas exitosamente'
  });
}));

/**
 * GET /api/teams/:id/stats
 * Obtener estadísticas de un equipo
 */
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      region: true,
      positions: {
        include: {
          tournament: true
        }
      }
    }
  });

  if (!team) {
    throw Errors.NOT_FOUND('Equipo no encontrado');
  }

  // Calcular estadísticas
  const totalTournaments = team.positions.length;
  const tournamentsByYear = team.positions.reduce((acc, pos) => {
    const year = pos.tournament.year;
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {} as any);

  const tournamentsByType = team.positions.reduce((acc, pos) => {
    const type = pos.tournament.type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as any);

  const bestPosition = Math.min(...team.positions.map(p => p.position));
  const averagePosition = team.positions.reduce((sum, p) => sum + p.position, 0) / totalTournaments;

  const stats = {
    teamId: team.id,
    teamName: team.name,
    totalTournaments,
    tournamentsByYear,
    tournamentsByType,
    bestPosition: totalTournaments > 0 ? bestPosition : null,
    averagePosition: totalTournaments > 0 ? Math.round(averagePosition * 100) / 100 : null,
    region: {
      id: team.region.id,
      name: team.region.name,
      code: team.region.code,
      coefficient: team.region.coefficient
    }
  };

  res.json({
    success: true,
    data: stats,
    message: 'Estadísticas del equipo obtenidas exitosamente'
  });
}));

export default router;
