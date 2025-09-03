import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { RankingService } from '@/services/rankingService';
import { asyncHandler, Errors } from '@/middleware/errorHandler';
import { authMiddleware } from '@/middleware/auth';
import { criticalOperationAudit } from '@/middleware/audit';

const router = Router();
const rankingService = new RankingService();

// Validaciones para filtros de ranking
const rankingFiltersValidation = [
  query('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('Año inválido'),
  query('surface').optional().isIn(['GRASS', 'BEACH', 'INDOOR']).withMessage('Superficie inválida'),
  query('modality').optional().isIn(['OPEN', 'MIXED', 'WOMEN']).withMessage('Modalidad inválida'),
  query('regionId').optional().isString().withMessage('ID de región inválido'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset inválido')
];

/**
 * GET /api/ranking
 * Obtener ranking con filtros opcionales
 */
router.get('/', rankingFiltersValidation, asyncHandler(async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.VALIDATION_ERROR(errors.array()[0].msg);
  }

  const filters = {
    year: req.query.year ? parseInt(req.query.year as string) : undefined,
    surface: req.query.surface as any,
    modality: req.query.modality as any,
    regionId: req.query.regionId as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
  };

  const ranking = await rankingService.getRanking(filters);

  res.json({
    success: true,
    data: ranking,
    message: 'Ranking obtenido exitosamente'
  });
}));

/**
 * GET /api/ranking/stats
 * Obtener estadísticas del ranking
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await rankingService.getRankingStats();

  res.json({
    success: true,
    data: stats,
    message: 'Estadísticas obtenidas exitosamente'
  });
}));

/**
 * GET /api/ranking/team/:id
 * Obtener ranking específico de un equipo
 */
router.get('/team/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const filters = {
    year: req.query.year ? parseInt(req.query.year as string) : undefined
  };

  const ranking = await rankingService.getRanking(filters);
  const teamRanking = ranking.find(entry => entry.team.id === id);

  if (!teamRanking) {
    throw Errors.NOT_FOUND('Equipo no encontrado en el ranking');
  }

  res.json({
    success: true,
    data: teamRanking,
    message: 'Ranking del equipo obtenido exitosamente'
  });
}));

/**
 * GET /api/ranking/region/:id
 * Obtener ranking filtrado por región
 */
router.get('/region/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const filters = {
    regionId: id,
    year: req.query.year ? parseInt(req.query.year as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
  };

  const ranking = await rankingService.getRanking(filters);

  res.json({
    success: true,
    data: ranking,
    message: 'Ranking de la región obtenido exitosamente'
  });
}));

/**
 * POST /api/ranking/recalculate
 * Recalcular ranking (protegido, solo admin)
 */
router.post('/recalculate', authMiddleware, criticalOperationAudit('RECALCULATE_RANKING'), asyncHandler(async (req, res) => {
  const ranking = await rankingService.recalculateRanking();

  res.json({
    success: true,
    data: {
      ranking,
      totalTeams: ranking.length,
      recalculatedAt: new Date().toISOString()
    },
    message: `Ranking recalculado exitosamente. ${ranking.length} equipos procesados.`
  });
}));

/**
 * GET /api/ranking/history
 * Obtener historial de rankings por año
 */
router.get('/history', asyncHandler(async (req, res) => {
  const { year } = req.query;
  
  if (!year || isNaN(parseInt(year as string))) {
    throw Errors.BAD_REQUEST('Año requerido para obtener historial');
  }

  const yearInt = parseInt(year as string);
  const ranking = await rankingService.getRanking({ year: yearInt });

  res.json({
    success: true,
    data: {
      year: yearInt,
      ranking,
      totalTeams: ranking.length
    },
    message: `Historial del ranking ${yearInt} obtenido exitosamente`
  });
}));

/**
 * GET /api/ranking/evolution/:teamId
 * Obtener evolución histórica de un equipo
 */
router.get('/evolution/:teamId', asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { years = 4 } = req.query;

  const currentYear = new Date().getFullYear();
  const yearRange = parseInt(years as string);
  const evolution = [];

  for (let i = 0; i < yearRange; i++) {
    const year = currentYear - i;
    try {
      const ranking = await rankingService.getRanking({ year });
      const teamEntry = ranking.find(entry => entry.team.id === teamId);
      
      if (teamEntry) {
        evolution.push({
          year,
          rank: teamEntry.rank,
          points: teamEntry.totalPoints,
          yearBreakdown: teamEntry.yearBreakdown
        });
      }
    } catch (error) {
      // Si no hay datos para ese año, continuar
      console.warn(`No hay datos para el año ${year}`);
    }
  }

  res.json({
    success: true,
    data: {
      teamId,
      evolution: evolution.reverse() // Ordenar cronológicamente
    },
    message: 'Evolución histórica obtenida exitosamente'
  });
}));

/**
 * GET /api/ranking/top
 * Obtener top N equipos
 */
router.get('/top', asyncHandler(async (req, res) => {
  const { limit = 10, year } = req.query;
  const limitInt = Math.min(parseInt(limit as string), 50); // Máximo 50

  const filters = {
    limit: limitInt,
    year: year ? parseInt(year as string) : undefined
  };

  const ranking = await rankingService.getRanking(filters);

  res.json({
    success: true,
    data: {
      top: ranking,
      limit: limitInt,
      year: year ? parseInt(year as string) : new Date().getFullYear()
    },
    message: `Top ${limitInt} equipos obtenidos exitosamente`
  });
}));

/**
 * GET /api/ranking/compare
 * Comparar equipos específicos
 */
router.get('/compare', asyncHandler(async (req, res) => {
  const { teamIds } = req.query;
  
  if (!teamIds || !Array.isArray(teamIds)) {
    throw Errors.BAD_REQUEST('Se requieren IDs de equipos para comparar');
  }

  const teamIdsArray = teamIds as string[];
  if (teamIdsArray.length > 10) {
    throw Errors.BAD_REQUEST('Máximo 10 equipos para comparar');
  }

  const ranking = await rankingService.getRanking();
  const comparison = teamIdsArray.map(teamId => {
    const teamEntry = ranking.find(entry => entry.team.id === teamId);
    return teamEntry || null;
  }).filter(Boolean);

  res.json({
    success: true,
    data: {
      comparison,
      totalTeams: comparison.length
    },
    message: 'Comparación de equipos obtenida exitosamente'
  });
}));

export default router;
