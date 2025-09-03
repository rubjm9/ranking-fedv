import { TournamentType, Surface, Modality } from '@prisma/client';

// Tipos de respuesta API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Tipos para autenticación
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// Tipos para equipos
export interface CreateTeamRequest {
  name: string;
  club?: string;
  regionId: string;
  email?: string;
  logo?: string;
}

export interface UpdateTeamRequest extends Partial<CreateTeamRequest> {}

// Tipos para regiones
export interface CreateRegionRequest {
  name: string;
  code: string;
  coefficient?: number;
  floor?: number;
  ceiling?: number;
  increment?: number;
}

export interface UpdateRegionRequest extends Partial<CreateRegionRequest> {}

// Tipos para torneos
export interface CreateTournamentRequest {
  name: string;
  type: TournamentType;
  year: number;
  surface: Surface;
  modality: Modality;
  regionId?: string;
}

export interface UpdateTournamentRequest extends Partial<CreateTournamentRequest> {}

// Tipos para posiciones
export interface PositionRequest {
  teamId: string;
  position: number;
}

export interface CreatePositionsRequest {
  tournamentId: string;
  positions: PositionRequest[];
}

// Tipos para ranking
export interface RankingFilters {
  year?: number;
  surface?: Surface;
  modality?: Modality;
  regionId?: string;
  limit?: number;
  offset?: number;
}

export interface RankingEntry {
  rank: number;
  team: {
    id: string;
    name: string;
    club?: string;
    region: {
      id: string;
      name: string;
      code: string;
    };
  };
  totalPoints: number;
  yearBreakdown: {
    [year: number]: {
      cePoints: number;
      regionalPoints: number;
      totalPoints: number;
      weightedPoints: number;
    };
  };
}

// Tipos para configuración
export interface PointsTable {
  [position: number]: number;
}

export interface TemporalWeights {
  [yearOffset: number]: number;
}

export interface RegionalCoefficientConfig {
  floor: number;
  ceiling: number;
  increment: number;
}

export interface ConfigurationData {
  ce1Points: PointsTable;
  ce2Points: PointsTable;
  regionalPoints: PointsTable;
  temporalWeights: TemporalWeights;
  regionalCoefficient: RegionalCoefficientConfig;
}

// Tipos para importación
export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  warnings: string[];
}

// Tipos para auditoría
export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ip?: string;
  userAgent?: string;
}

// Tipos para cálculo de ranking
export interface RankingCalculation {
  teamId: string;
  year: number;
  cePoints: number;
  regionalPoints: number;
  regionalCoefficient: number;
  weightedPoints: number;
  temporalWeight: number;
}

export interface TeamRankingResult {
  teamId: string;
  totalPoints: number;
  yearBreakdown: {
    [year: number]: RankingCalculation;
  };
}

// Tipos para exportación
export interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  filters?: RankingFilters;
  includeDetails?: boolean;
}

// Tipos para validación
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Tipos para paginación
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Tipos para estadísticas
export interface RegionStats {
  regionId: string;
  regionName: string;
  totalTeams: number;
  totalPoints: number;
  averagePoints: number;
  coefficient: number;
  topTeams: Array<{
    teamId: string;
    teamName: string;
    points: number;
  }>;
}

export interface TournamentStats {
  tournamentId: string;
  tournamentName: string;
  type: TournamentType;
  year: number;
  surface: Surface;
  modality: Modality;
  totalTeams: number;
  regionBreakdown: Array<{
    regionId: string;
    regionName: string;
    teams: number;
    points: number;
  }>;
}
