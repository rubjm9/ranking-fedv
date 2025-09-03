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

export interface User {
  id: string;
  email: string;
  role: string;
}

// Tipos para equipos
export interface Team {
  id: string;
  name: string;
  club?: string;
  regionId: string;
  email?: string;
  logo?: string;
  region: Region;
  positions?: Position[];
}

export interface CreateTeamRequest {
  name: string;
  club?: string;
  regionId: string;
  email?: string;
  logo?: string;
}

export interface UpdateTeamRequest extends Partial<CreateTeamRequest> {}

// Tipos para regiones
export interface Region {
  id: string;
  name: string;
  code: string;
  coefficient: number;
  floor: number;
  ceiling: number;
  increment: number;
  teams?: Team[];
  tournaments?: Tournament[];
}

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
export enum TournamentType {
  CE1 = 'CE1',
  CE2 = 'CE2',
  REGIONAL = 'REGIONAL'
}

export enum Surface {
  GRASS = 'GRASS',
  BEACH = 'BEACH',
  INDOOR = 'INDOOR'
}

export enum Modality {
  OPEN = 'OPEN',
  MIXED = 'MIXED',
  WOMEN = 'WOMEN'
}

export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  year: number;
  surface: Surface;
  modality: Modality;
  regionId?: string;
  region?: Region;
  positions?: Position[];
}

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
export interface Position {
  id: string;
  position: number;
  teamId: string;
  tournamentId: string;
  team?: Team;
  tournament?: Tournament;
}

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

// Tipos para gráficas
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface LineChartData {
  name: string;
  [key: string]: number | string;
}

export interface TeamEvolutionData {
  year: number;
  rank: number;
  points: number;
}

// Tipos para filtros
export interface FilterOptions {
  regions: Region[];
  years: number[];
  surfaces: Surface[];
  modalities: Modality[];
}

// Tipos para navegación
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

// Tipos para formularios
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'file';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: any;
}

// Tipos para notificaciones
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// Tipos para modales
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Tipos para loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// Tipos para breadcrumbs
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Tipos para sidebar
export interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: SidebarItem[];
}

// Tipos para dashboard
export interface DashboardStats {
  totalTeams: number;
  totalRegions: number;
  totalTournaments: number;
  lastUpdated: string;
}

export interface DashboardChart {
  title: string;
  data: ChartData[];
  type: 'pie' | 'bar' | 'line';
}

// Tipos para exportación
export interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  filters?: RankingFilters;
  includeDetails?: boolean;
}

// Tipos para búsqueda
export interface SearchFilters {
  query: string;
  regionId?: string;
  year?: number;
  type?: TournamentType;
}

// Tipos para comparación
export interface ComparisonData {
  teamId: string;
  teamName: string;
  ranking: RankingEntry;
  evolution: TeamEvolutionData[];
}
