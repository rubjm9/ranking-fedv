/**
 * Utilidades para detectar características y funcionalidades del sistema
 */

export interface FeatureReport {
  timestamp: string
  features: {
    [key: string]: {
      name: string
      status: 'active' | 'inactive' | 'deprecated' | 'missing'
      description: string
      location?: string
      dependencies?: string[]
    }
  }
  summary: {
    total: number
    active: number
    inactive: number
    deprecated: number
    missing: number
  }
}

/**
 * Generar reporte de características del sistema
 */
export const generateFeatureReport = (): FeatureReport => {
  const timestamp = new Date().toISOString()
  
  const features = {
    // Sistema de ranking
    'ranking-system': {
      name: 'Sistema de Ranking',
      status: 'active' as const,
      description: 'Sistema principal de cálculo de rankings',
      location: 'src/services/rankingService.ts',
      dependencies: ['positions', 'teams', 'tournaments']
    },
    
    'hybrid-ranking': {
      name: 'Sistema Híbrido de Ranking',
      status: 'active' as const,
      description: 'Sistema optimizado con cache materializada',
      location: 'src/services/hybridRankingService.ts',
      dependencies: ['team_season_points', 'positions']
    },
    
    'season-points': {
      name: 'Gestión de Puntos por Temporada',
      status: 'active' as const,
      description: 'Servicio para gestionar puntos agregados por temporada',
      location: 'src/services/seasonPointsService.ts',
      dependencies: ['team_season_points']
    },
    
    // Páginas principales
    'public-ranking': {
      name: 'Ranking Público',
      status: 'active' as const,
      description: 'Página pública de rankings con análisis avanzado',
      location: 'src/pages/RankingPageHybrid.tsx',
      dependencies: ['hybrid-ranking']
    },
    
    'admin-ranking': {
      name: 'Ranking Administrativo',
      status: 'active' as const,
      description: 'Panel administrativo de rankings',
      location: 'src/pages/admin/RankingAdminPageHybrid.tsx',
      dependencies: ['hybrid-ranking']
    },
    
    // Funcionalidades de análisis
    'team-analysis': {
      name: 'Análisis de Equipos',
      status: 'active' as const,
      description: 'Gráficas y comparación de equipos',
      location: 'src/pages/RankingPageHybrid.tsx (renderAnalysisTab)',
      dependencies: ['public-ranking']
    },
    
    'top-performers': {
      name: 'Top Performers',
      status: 'active' as const,
      description: 'Análisis de mejores equipos por categorías',
      location: 'src/pages/RankingPageHybrid.tsx (renderPerformersTab)',
      dependencies: ['public-ranking']
    },
    
    // Herramientas administrativas
    'season-management': {
      name: 'Gestión de Temporadas',
      status: 'active' as const,
      description: 'Panel para gestionar temporadas y coeficientes',
      location: 'src/pages/admin/SeasonManagementPage.tsx',
      dependencies: ['season-points']
    },
    
    'ranking-comparison': {
      name: 'Comparación de Sistemas',
      status: 'active' as const,
      description: 'Comparar sistema original vs híbrido',
      location: 'src/pages/admin/RankingComparisonPage.tsx',
      dependencies: ['ranking-system', 'hybrid-ranking']
    },
    
    'database-diagnostic': {
      name: 'Diagnóstico de Base de Datos',
      status: 'active' as const,
      description: 'Herramientas de diagnóstico y mantenimiento',
      location: 'src/pages/admin/DatabaseDiagnosticPage.tsx',
      dependencies: ['hybrid-ranking', 'season-points']
    },
    
    // Funcionalidades obsoletas
    'old-ranking-components': {
      name: 'Componentes de Ranking Antiguos',
      status: 'deprecated' as const,
      description: 'RankingEvolution, RankingHistory, SeasonComparison',
      location: 'src/components/ranking/ (eliminados)',
      dependencies: []
    },
    
    'legacy-ranking-pages': {
      name: 'Páginas de Ranking Antiguas',
      status: 'deprecated' as const,
      description: 'RankingPage.tsx, RankingAdminPage.tsx',
      location: 'src/pages/ (eliminados)',
      dependencies: []
    },
    
    // Servicios de soporte
    'auto-ranking': {
      name: 'Actualización Automática',
      status: 'active' as const,
      description: 'Servicio de actualización automática de rankings',
      location: 'src/services/autoRankingService.ts',
      dependencies: ['hybrid-ranking']
    },
    
    'debug-utilities': {
      name: 'Utilidades de Debug',
      status: 'active' as const,
      description: 'Herramientas de debug y diagnóstico',
      location: 'src/utils/debugRanking.ts',
      dependencies: ['ranking-system']
    },
    
    'mock-services': {
      name: 'Servicios Mock',
      status: 'active' as const,
      description: 'Servicios mock para desarrollo y testing',
      location: 'src/services/mockService.ts',
      dependencies: []
    }
  }
  
  // Calcular resumen
  const summary = {
    total: Object.keys(features).length,
    active: Object.values(features).filter(f => f.status === 'active').length,
    inactive: Object.values(features).filter(f => f.status === 'inactive').length,
    deprecated: Object.values(features).filter(f => f.status === 'deprecated').length,
    missing: Object.values(features).filter(f => f.status === 'missing').length
  }
  
  return {
    timestamp,
    features,
    summary
  }
}

/**
 * Verificar si una característica está disponible
 */
export const isFeatureAvailable = (featureKey: string): boolean => {
  const report = generateFeatureReport()
  return report.features[featureKey]?.status === 'active'
}

/**
 * Obtener características activas
 */
export const getActiveFeatures = (): string[] => {
  const report = generateFeatureReport()
  return Object.keys(report.features).filter(key => 
    report.features[key].status === 'active'
  )
}

/**
 * Obtener características deprecadas
 */
export const getDeprecatedFeatures = (): string[] => {
  const report = generateFeatureReport()
  return Object.keys(report.features).filter(key => 
    report.features[key].status === 'deprecated'
  )
}
