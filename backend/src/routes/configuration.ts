import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, Errors } from '@/middleware/errorHandler';
import { authMiddleware } from '@/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validaciones para configuración
const updateConfigValidation = [
  body('ce1Points').optional().isObject().withMessage('Tabla de puntos CE1 debe ser un objeto'),
  body('ce2Points').optional().isObject().withMessage('Tabla de puntos CE2 debe ser un objeto'),
  body('regionalPoints').optional().isObject().withMessage('Tabla de puntos regionales debe ser un objeto'),
  body('temporalWeights').optional().isObject().withMessage('Ponderadores temporales debe ser un objeto'),
  body('regionalCoefficient').optional().isObject().withMessage('Configuración de coeficiente regional debe ser un objeto')
];

/**
 * GET /api/admin/configuration
 * Obtener configuración actual del sistema
 */
router.get('/', asyncHandler(async (req, res) => {
  const config = await prisma.configuration.findFirst({
    where: { key: 'ranking_config' }
  });

  // Configuración por defecto si no existe
  const defaultConfig = {
    ce1Points: {
      1: 1000, 2: 850, 3: 725, 4: 625, 5: 520, 6: 450, 7: 380, 8: 320,
      9: 270, 10: 230, 11: 195, 12: 165, 13: 140, 14: 120, 15: 105, 16: 90,
      17: 75, 18: 65, 19: 55, 20: 46, 21: 39, 22: 34, 23: 30, 24: 27
    },
    ce2Points: {
      1: 230, 2: 195, 3: 165, 4: 140, 5: 120, 6: 103, 7: 86, 8: 74,
      9: 63, 10: 54, 11: 46, 12: 39, 13: 34, 14: 29, 15: 25, 16: 21,
      17: 18, 18: 15, 19: 13, 20: 11, 21: 9, 22: 8, 23: 7, 24: 6
    },
    regionalPoints: {
      1: 140, 2: 120, 3: 100, 4: 85, 5: 72, 6: 60, 7: 50, 8: 42,
      9: 35, 10: 30, 11: 25, 12: 21, 13: 18, 14: 15, 15: 13, 16: 11,
      17: 9, 18: 8, 19: 7, 20: 6, 21: 5, 22: 4, 23: 3, 24: 2
    },
    temporalWeights: {
      0: 1.0,  // Año actual
      1: 0.8,  // Año -1
      2: 0.5,  // Año -2
      3: 0.2   // Año -3
    },
    regionalCoefficient: {
      floor: 0.8,
      ceiling: 1.2,
      increment: 0.01
    }
  };

  const currentConfig = config ? config.value : defaultConfig;

  res.json({
    success: true,
    data: currentConfig,
    message: 'Configuración obtenida exitosamente'
  });
}));

/**
 * PUT /api/admin/configuration
 * Actualizar configuración del sistema
 */
router.put('/', authMiddleware, updateConfigValidation, asyncHandler(async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.VALIDATION_ERROR(errors.array()[0].msg);
  }

  const { ce1Points, ce2Points, regionalPoints, temporalWeights, regionalCoefficient } = req.body;

  // Obtener configuración actual
  const currentConfig = await prisma.configuration.findFirst({
    where: { key: 'ranking_config' }
  });

  const defaultConfig = {
    ce1Points: {
      1: 1000, 2: 850, 3: 725, 4: 625, 5: 520, 6: 450, 7: 380, 8: 320,
      9: 270, 10: 230, 11: 195, 12: 165, 13: 140, 14: 120, 15: 105, 16: 90,
      17: 75, 18: 65, 19: 55, 20: 46, 21: 39, 22: 34, 23: 30, 24: 27
    },
    ce2Points: {
      1: 230, 2: 195, 3: 165, 4: 140, 5: 120, 6: 103, 7: 86, 8: 74,
      9: 63, 10: 54, 11: 46, 12: 39, 13: 34, 14: 29, 15: 25, 16: 21,
      17: 18, 18: 15, 19: 13, 20: 11, 21: 9, 22: 8, 23: 7, 24: 6
    },
    regionalPoints: {
      1: 140, 2: 120, 3: 100, 4: 85, 5: 72, 6: 60, 7: 50, 8: 42,
      9: 35, 10: 30, 11: 25, 12: 21, 13: 18, 14: 15, 15: 13, 16: 11,
      17: 9, 18: 8, 19: 7, 20: 6, 21: 5, 22: 4, 23: 3, 24: 2
    },
    temporalWeights: {
      0: 1.0,  // Año actual
      1: 0.8,  // Año -1
      2: 0.5,  // Año -2
      3: 0.2   // Año -3
    },
    regionalCoefficient: {
      floor: 0.8,
      ceiling: 1.2,
      increment: 0.01
    }
  };

  // Construir nueva configuración
  const newConfig = {
    ...(currentConfig ? currentConfig.value : defaultConfig),
    ...(ce1Points && { ce1Points }),
    ...(ce2Points && { ce2Points }),
    ...(regionalPoints && { regionalPoints }),
    ...(temporalWeights && { temporalWeights }),
    ...(regionalCoefficient && { regionalCoefficient })
  };

  // Validar configuración
  if (newConfig.regionalCoefficient) {
    const { floor, ceiling, increment } = newConfig.regionalCoefficient;
    if (floor >= ceiling) {
      throw Errors.BAD_REQUEST('El suelo debe ser menor que el techo');
    }
    if (increment <= 0) {
      throw Errors.BAD_REQUEST('El incremento debe ser positivo');
    }
  }

  // Guardar configuración
  if (currentConfig) {
    await prisma.configuration.update({
      where: { id: currentConfig.id },
      data: { value: newConfig }
    });
  } else {
    await prisma.configuration.create({
      data: {
        key: 'ranking_config',
        value: newConfig
      }
    });
  }

  res.json({
    success: true,
    data: newConfig,
    message: 'Configuración actualizada exitosamente'
  });
}));

/**
 * POST /api/admin/configuration/reset
 * Restablecer configuración por defecto
 */
router.post('/reset', authMiddleware, asyncHandler(async (req, res) => {
  const defaultConfig = {
    ce1Points: {
      1: 1000, 2: 850, 3: 725, 4: 625, 5: 520, 6: 450, 7: 380, 8: 320,
      9: 270, 10: 230, 11: 195, 12: 165, 13: 140, 14: 120, 15: 105, 16: 90,
      17: 75, 18: 65, 19: 55, 20: 46, 21: 39, 22: 34, 23: 30, 24: 27
    },
    ce2Points: {
      1: 230, 2: 195, 3: 165, 4: 140, 5: 120, 6: 103, 7: 86, 8: 74,
      9: 63, 10: 54, 11: 46, 12: 39, 13: 34, 14: 29, 15: 25, 16: 21,
      17: 18, 18: 15, 19: 13, 20: 11, 21: 9, 22: 8, 23: 7, 24: 6
    },
    regionalPoints: {
      1: 140, 2: 120, 3: 100, 4: 85, 5: 72, 6: 60, 7: 50, 8: 42,
      9: 35, 10: 30, 11: 25, 12: 21, 13: 18, 14: 15, 15: 13, 16: 11,
      17: 9, 18: 8, 19: 7, 20: 6, 21: 5, 22: 4, 23: 3, 24: 2
    },
    temporalWeights: {
      0: 1.0,  // Año actual
      1: 0.8,  // Año -1
      2: 0.5,  // Año -2
      3: 0.2   // Año -3
    },
    regionalCoefficient: {
      floor: 0.8,
      ceiling: 1.2,
      increment: 0.01
    }
  };

  const currentConfig = await prisma.configuration.findFirst({
    where: { key: 'ranking_config' }
  });

  if (currentConfig) {
    await prisma.configuration.update({
      where: { id: currentConfig.id },
      data: { value: defaultConfig }
    });
  } else {
    await prisma.configuration.create({
      data: {
        key: 'ranking_config',
        value: defaultConfig
      }
    });
  }

  res.json({
    success: true,
    data: defaultConfig,
    message: 'Configuración restablecida a valores por defecto'
  });
}));

/**
 * GET /api/admin/configuration/validate
 * Validar configuración actual
 */
router.get('/validate', asyncHandler(async (req, res) => {
  const config = await prisma.configuration.findFirst({
    where: { key: 'ranking_config' }
  });

  if (!config) {
    return res.json({
      success: true,
      data: {
        isValid: true,
        message: 'Configuración por defecto válida'
      }
    });
  }

  const configValue = config.value as any;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar tablas de puntos
  if (configValue.ce1Points) {
    const positions = Object.keys(configValue.ce1Points).map(Number);
    if (positions.length === 0) {
      errors.push('Tabla de puntos CE1 está vacía');
    }
    if (Math.min(...positions) !== 1) {
      warnings.push('Tabla de puntos CE1 no empieza en posición 1');
    }
  }

  if (configValue.ce2Points) {
    const positions = Object.keys(configValue.ce2Points).map(Number);
    if (positions.length === 0) {
      errors.push('Tabla de puntos CE2 está vacía');
    }
    if (Math.min(...positions) !== 1) {
      warnings.push('Tabla de puntos CE2 no empieza en posición 1');
    }
  }

  if (configValue.regionalPoints) {
    const positions = Object.keys(configValue.regionalPoints).map(Number);
    if (positions.length === 0) {
      errors.push('Tabla de puntos regionales está vacía');
    }
    if (Math.min(...positions) !== 1) {
      warnings.push('Tabla de puntos regionales no empieza en posición 1');
    }
  }

  // Validar ponderadores temporales
  if (configValue.temporalWeights) {
    const weights = Object.values(configValue.temporalWeights) as number[];
    if (weights.some(w => w < 0 || w > 1)) {
      errors.push('Los ponderadores temporales deben estar entre 0 y 1');
    }
  }

  // Validar coeficiente regional
  if (configValue.regionalCoefficient) {
    const { floor, ceiling, increment } = configValue.regionalCoefficient;
    if (floor >= ceiling) {
      errors.push('El suelo debe ser menor que el techo');
    }
    if (increment <= 0) {
      errors.push('El incremento debe ser positivo');
    }
  }

  res.json({
    success: true,
    data: {
      isValid: errors.length === 0,
      errors,
      warnings,
      message: errors.length === 0 ? 'Configuración válida' : 'Configuración con errores'
    }
  });
}));

/**
 * GET /api/admin/configuration/backup
 * Crear backup de la configuración
 */
router.get('/backup', authMiddleware, asyncHandler(async (req, res) => {
  const config = await prisma.configuration.findFirst({
    where: { key: 'ranking_config' }
  });

  const backupData = {
    timestamp: new Date().toISOString(),
    configuration: config ? config.value : null,
    version: '1.0.0'
  };

  res.json({
    success: true,
    data: backupData,
    message: 'Backup de configuración creado exitosamente'
  });
}));

/**
 * POST /api/admin/configuration/restore
 * Restaurar configuración desde backup
 */
router.post('/restore', authMiddleware, asyncHandler(async (req, res) => {
  const { configuration } = req.body;

  if (!configuration) {
    throw Errors.BAD_REQUEST('Datos de configuración requeridos');
  }

  const currentConfig = await prisma.configuration.findFirst({
    where: { key: 'ranking_config' }
  });

  if (currentConfig) {
    await prisma.configuration.update({
      where: { id: currentConfig.id },
      data: { value: configuration }
    });
  } else {
    await prisma.configuration.create({
      data: {
        key: 'ranking_config',
        value: configuration
      }
    });
  }

  res.json({
    success: true,
    data: configuration,
    message: 'Configuración restaurada exitosamente'
  });
}));

export default router;
