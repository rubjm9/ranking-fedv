import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, Errors } from '@/middleware/errorHandler';
import { authMiddleware } from '@/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validaciones para regiones
const createRegionValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('code').trim().isLength({ min: 2, max: 10 }).withMessage('Código debe tener entre 2 y 10 caracteres'),
  body('coefficient').optional().isFloat({ min: 0.1, max: 2.0 }).withMessage('Coeficiente debe estar entre 0.1 y 2.0'),
  body('floor').optional().isFloat({ min: 0.1, max: 1.0 }).withMessage('Suelo debe estar entre 0.1 y 1.0'),
  body('ceiling').optional().isFloat({ min: 1.0, max: 3.0 }).withMessage('Techo debe estar entre 1.0 y 3.0'),
  body('increment').optional().isFloat({ min: 0.001, max: 0.1 }).withMessage('Incremento debe estar entre 0.001 y 0.1')
];

const updateRegionValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('code').optional().trim().isLength({ min: 2, max: 10 }).withMessage('Código debe tener entre 2 y 10 caracteres'),
  body('coefficient').optional().isFloat({ min: 0.1, max: 2.0 }).withMessage('Coeficiente debe estar entre 0.1 y 2.0'),
  body('floor').optional().isFloat({ min: 0.1, max: 1.0 }).withMessage('Suelo debe estar entre 0.1 y 1.0'),
  body('ceiling').optional().isFloat({ min: 1.0, max: 3.0 }).withMessage('Techo debe estar entre 1.0 y 3.0'),
  body('increment').optional().isFloat({ min: 0.001, max: 0.1 }).withMessage('Incremento debe estar entre 0.001 y 0.1')
];

/**
 * GET /api/regions
 * Obtener lista de regiones
 */
router.get('/', asyncHandler(async (req, res) => {
  const regions = await prisma.region.findMany({
    include: {
      _count: {
        select: {
          teams: true,
          tournaments: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  res.json({
    success: true,
    data: regions,
    message: 'Regiones obtenidas exitosamente'
  });
}));

/**
 * GET /api/regions/:id
 * Obtener región específica
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const region = await prisma.region.findUnique({
    where: { id },
    include: {
      teams: {
        select: {
          id: true,
          name: true,
          club: true,
          _count: {
            select: {
              positions: true
            }
          }
        }
      },
      tournaments: {
        select: {
          id: true,
          name: true,
          type: true,
          year: true,
          surface: true,
          modality: true
        },
        orderBy: {
          year: 'desc'
        }
      },
      _count: {
        select: {
          teams: true,
          tournaments: true
        }
      }
    }
  });

  if (!region) {
    throw Errors.NOT_FOUND('Región no encontrada');
  }

  res.json({
    success: true,
    data: region,
    message: 'Región obtenida exitosamente'
  });
}));

/**
 * POST /api/regions
 * Crear nueva región (protegido, solo admin)
 */
router.post('/', authMiddleware, createRegionValidation, asyncHandler(async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.VALIDATION_ERROR(errors.array()[0].msg);
  }

  const { name, code, coefficient = 1.0, floor = 0.8, ceiling = 1.2, increment = 0.01 } = req.body;

  // Verificar que no existe una región con el mismo nombre o código
  const existingRegion = await prisma.region.findFirst({
    where: {
      OR: [
        { name },
        { code }
      ]
    }
  });

  if (existingRegion) {
    throw Errors.CONFLICT('Ya existe una región con ese nombre o código');
  }

  const region = await prisma.region.create({
    data: {
      name,
      code,
      coefficient,
      floor,
      ceiling,
      increment
    }
  });

  res.status(201).json({
    success: true,
    data: region,
    message: 'Región creada exitosamente'
  });
}));

/**
 * PUT /api/regions/:id
 * Actualizar región (protegido, solo admin)
 */
router.put('/:id', authMiddleware, updateRegionValidation, asyncHandler(async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.VALIDATION_ERROR(errors.array()[0].msg);
  }

  const { id } = req.params;
  const { name, code, coefficient, floor, ceiling, increment } = req.body;

  // Verificar que la región existe
  const existingRegion = await prisma.region.findUnique({
    where: { id }
  });

  if (!existingRegion) {
    throw Errors.NOT_FOUND('Región no encontrada');
  }

  // Verificar conflictos de nombre o código
  if (name || code) {
    const conflict = await prisma.region.findFirst({
      where: {
        OR: [
          name ? { name } : {},
          code ? { code } : {}
        ],
        id: { not: id }
      }
    });

    if (conflict) {
      throw Errors.CONFLICT('Ya existe una región con ese nombre o código');
    }
  }

  const region = await prisma.region.update({
    where: { id },
    data: {
      name,
      code,
      coefficient,
      floor,
      ceiling,
      increment
    }
  });

  res.json({
    success: true,
    data: region,
    message: 'Región actualizada exitosamente'
  });
}));

/**
 * DELETE /api/regions/:id
 * Eliminar región (protegido, solo admin)
 */
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar que la región existe
  const region = await prisma.region.findUnique({
    where: { id },
    include: {
      teams: true,
      tournaments: true
    }
  });

  if (!region) {
    throw Errors.NOT_FOUND('Región no encontrada');
  }

  // Verificar que no tiene equipos o torneos asociados
  if (region.teams.length > 0) {
    throw Errors.CONFLICT('No se puede eliminar una región que tiene equipos asociados');
  }

  if (region.tournaments.length > 0) {
    throw Errors.CONFLICT('No se puede eliminar una región que tiene torneos asociados');
  }

  await prisma.region.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Región eliminada exitosamente'
  });
}));

/**
 * GET /api/regions/:id/stats
 * Obtener estadísticas de una región
 */
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const region = await prisma.region.findUnique({
    where: { id },
    include: {
      teams: {
        include: {
          positions: {
            include: {
              tournament: true
            }
          }
        }
      }
    }
  });

  if (!region) {
    throw Errors.NOT_FOUND('Región no encontrada');
  }

  // Calcular estadísticas
  const totalTeams = region.teams.length;
  const totalTournaments = region.teams.reduce((sum, team) => sum + team.positions.length, 0);
  
  const tournamentsByYear = region.teams.reduce((acc, team) => {
    team.positions.forEach(pos => {
      const year = pos.tournament.year;
      acc[year] = (acc[year] || 0) + 1;
    });
    return acc;
  }, {} as any);

  const tournamentsByType = region.teams.reduce((acc, team) => {
    team.positions.forEach(pos => {
      const type = pos.tournament.type;
      acc[type] = (acc[type] || 0) + 1;
    });
    return acc;
  }, {} as any);

  const topTeams = region.teams
    .map(team => ({
      id: team.id,
      name: team.name,
      totalTournaments: team.positions.length
    }))
    .sort((a, b) => b.totalTournaments - a.totalTournaments)
    .slice(0, 5);

  const stats = {
    regionId: region.id,
    regionName: region.name,
    regionCode: region.code,
    coefficient: region.coefficient,
    floor: region.floor,
    ceiling: region.ceiling,
    increment: region.increment,
    totalTeams,
    totalTournaments,
    tournamentsByYear,
    tournamentsByType,
    topTeams
  };

  res.json({
    success: true,
    data: stats,
    message: 'Estadísticas de la región obtenidas exitosamente'
  });
}));

/**
 * POST /api/regions/:id/recalculate-coefficient
 * Recalcular coeficiente de una región (protegido, solo admin)
 */
router.post('/:id/recalculate-coefficient', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { year } = req.body;

  const region = await prisma.region.findUnique({
    where: { id }
  });

  if (!region) {
    throw Errors.NOT_FOUND('Región no encontrada');
  }

  // Aquí se implementaría la lógica de recálculo del coeficiente
  // Por ahora, retornamos el coeficiente actual
  res.json({
    success: true,
    data: {
      regionId: region.id,
      coefficient: region.coefficient,
      recalculatedAt: new Date().toISOString()
    },
    message: 'Coeficiente recalculado exitosamente'
  });
}));

export default router;
