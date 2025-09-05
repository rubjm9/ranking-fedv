import { PrismaClient, TournamentType } from '@prisma/client';
import { 
  RankingCalculation, 
  TeamRankingResult, 
  RankingEntry,
  PointsTable,
  TemporalWeights,
  RegionalCoefficientConfig 
} from '@/types';

const prisma = new PrismaClient();

export class RankingService {
  // Tablas de puntos por defecto según las reglas FEDV
  private static readonly DEFAULT_CE1_POINTS: PointsTable = {
    1: 1000, 2: 850, 3: 725, 4: 625, 5: 520, 6: 450, 7: 380, 8: 320,
    9: 270, 10: 230, 11: 195, 12: 165, 13: 140, 14: 120, 15: 105, 16: 90,
    17: 75, 18: 65, 19: 55, 20: 46, 21: 39, 22: 34, 23: 30, 24: 27
  };

  private static readonly DEFAULT_CE2_POINTS: PointsTable = {
    1: 230, 2: 195, 3: 165, 4: 140, 5: 120, 6: 103, 7: 86, 8: 74,
    9: 63, 10: 54, 11: 46, 12: 39, 13: 34, 14: 29, 15: 25, 16: 21,
    17: 18, 18: 15, 19: 13, 20: 11, 21: 9, 22: 8, 23: 7, 24: 6
  };

  private static readonly DEFAULT_REGIONAL_POINTS: PointsTable = {
    1: 140, 2: 120, 3: 100, 4: 85, 5: 72, 6: 60, 7: 50, 8: 42,
    9: 35, 10: 30, 11: 25, 12: 21, 13: 18, 14: 15, 15: 13, 16: 11,
    17: 9, 18: 8, 19: 7, 20: 6, 21: 5, 22: 4, 23: 3, 24: 2
  };

  // Ponderadores temporales por defecto
  private static readonly DEFAULT_TEMPORAL_WEIGHTS: TemporalWeights = {
    0: 1.0,  // Año actual
    1: 0.8,  // Año -1
    2: 0.5,  // Año -2
    3: 0.2   // Año -3
  };

  // Configuración de coeficiente regional por defecto
  private static readonly DEFAULT_REGIONAL_COEFFICIENT: RegionalCoefficientConfig = {
    floor: 0.8,
    ceiling: 1.2,
    increment: 0.01
  };

  /**
   * Obtiene la configuración actual del sistema
   */
  private async getConfiguration() {
    const config = await prisma.configuration.findFirst({
      where: { key: 'ranking_config' }
    });

    if (!config) {
      return {
        ce1Points: RankingService.DEFAULT_CE1_POINTS,
        ce2Points: RankingService.DEFAULT_CE2_POINTS,
        regionalPoints: RankingService.DEFAULT_REGIONAL_POINTS,
        temporalWeights: RankingService.DEFAULT_TEMPORAL_WEIGHTS,
        regionalCoefficient: RankingService.DEFAULT_REGIONAL_COEFFICIENT
      };
    }

    return config.value as any;
  }

  /**
   * Calcula el coeficiente regional para una región en un año específico
   */
  private async calculateRegionalCoefficient(regionId: string, year: number): Promise<number> {
    const config = await this.getConfiguration();
    const { floor, ceiling, increment } = config.regionalCoefficient;

    // Obtener puntos totales de la región en CE1 y CE2 para el año
    const regionPoints = await prisma.position.findMany({
      where: {
        tournament: {
          year,
          type: { in: [TournamentType.CE1, TournamentType.CE2] }
        },
        team: { regionId }
      },
      include: {
        tournament: true,
        team: true
      }
    });

    let totalPoints = 0;
    const pointsTable = config.ce1Points;

    for (const position of regionPoints) {
      const points = position.tournament.type === TournamentType.CE1 
        ? config.ce1Points[position.position] || 0
        : config.ce2Points[position.position] || 0;
      totalPoints += points;
    }

    // Calcular coeficiente con clamp
    const coefficient = Math.max(floor, Math.min(ceiling, floor + totalPoints * increment));

    // Actualizar el coeficiente en la región
    await prisma.region.update({
      where: { id: regionId },
      data: { coefficient }
    });

    return coefficient;
  }

  /**
   * Obtiene los puntos de un equipo para un año específico
   */
  private async getTeamYearPoints(teamId: string, year: number): Promise<RankingCalculation> {
    const config = await this.getConfiguration();
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { region: true }
    });

    if (!team) {
      throw new Error(`Equipo no encontrado: ${teamId}`);
    }

    // Obtener posiciones del equipo en el año
    const positions = await prisma.position.findMany({
      where: {
        teamId,
        tournament: { year }
      },
      include: { tournament: true }
    });

    let cePoints = 0;
    let regionalPoints = 0;

    // Calcular puntos CE (1ª + 2ª división)
    for (const position of positions) {
      if (position.tournament.type === TournamentType.CE1) {
        cePoints += config.ce1Points[position.position] || 0;
      } else if (position.tournament.type === TournamentType.CE2) {
        cePoints += config.ce2Points[position.position] || 0;
      } else if (position.tournament.type === TournamentType.REGIONAL) {
        regionalPoints += config.regionalPoints[position.position] || 0;
      }
    }

    // Calcular coeficiente regional
    const regionalCoefficient = await this.calculateRegionalCoefficient(team.regionId, year);

    // Aplicar coeficiente regional solo a puntos regionales
    const adjustedRegionalPoints = regionalPoints * regionalCoefficient;

    // Calcular ponderador temporal
    const currentYear = new Date().getFullYear();
    const yearOffset = currentYear - year;
    const temporalWeight = config.temporalWeights[yearOffset] || 0;

    // Calcular puntos ponderados
    const totalPoints = cePoints + adjustedRegionalPoints;
    const weightedPoints = totalPoints * temporalWeight;

    return {
      teamId,
      year,
      cePoints,
      regionalPoints,
      regionalCoefficient,
      weightedPoints,
      temporalWeight
    };
  }

  /**
   * Calcula el ranking completo para todos los equipos
   */
  public async calculateRanking(): Promise<RankingEntry[]> {
    const currentYear = new Date().getFullYear();
    const yearRange = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

    // Obtener todos los equipos
    const teams = await prisma.team.findMany({
      include: { region: true }
    });

    const teamResults: TeamRankingResult[] = [];

    // Calcular puntos para cada equipo
    for (const team of teams) {
      const yearBreakdown: { [year: number]: RankingCalculation } = {};
      let totalPoints = 0;

      for (const year of yearRange) {
        try {
          const yearCalculation = await this.getTeamYearPoints(team.id, year);
          yearBreakdown[year] = yearCalculation;
          totalPoints += yearCalculation.weightedPoints;
        } catch (error) {
          // Si no hay datos para ese año, usar valores por defecto
          yearBreakdown[year] = {
            teamId: team.id,
            year,
            cePoints: 0,
            regionalPoints: 0,
            regionalCoefficient: 1.0,
            weightedPoints: 0,
            temporalWeight: RankingService.DEFAULT_TEMPORAL_WEIGHTS[currentYear - year] || 0
          };
        }
      }

      teamResults.push({
        teamId: team.id,
        totalPoints,
        yearBreakdown
      });
    }

    // Ordenar por puntos totales descendente
    teamResults.sort((a, b) => b.totalPoints - a.totalPoints);

    // Generar ranking final
    const ranking: RankingEntry[] = teamResults.map((result, index) => {
      const team = teams.find(t => t.id === result.teamId)!;
      
      return {
        rank: index + 1,
        team: {
          id: team.id,
          name: team.name,
          club: team.club || undefined,
          region: {
            id: team.region.id,
            name: team.region.name
          }
        },
        totalPoints: result.totalPoints,
        yearBreakdown: result.yearBreakdown
      };
    });

    // Guardar historial del ranking
    await this.saveRankingHistory(ranking);

    return ranking;
  }

  /**
   * Guarda el historial del ranking en la base de datos
   */
  private async saveRankingHistory(ranking: RankingEntry[]): Promise<void> {
    const currentYear = new Date().getFullYear();

    // Eliminar historial anterior del año actual
    await prisma.rankingHistory.deleteMany({
      where: { year: currentYear }
    });

    // Crear nuevos registros de historial
    const historyRecords = ranking.map(entry => ({
      teamId: entry.team.id,
      year: currentYear,
      points: entry.totalPoints,
      rank: entry.rank,
      details: entry.yearBreakdown
    }));

    await prisma.rankingHistory.createMany({
      data: historyRecords
    });
  }

  /**
   * Obtiene el ranking actual con filtros opcionales
   */
  public async getRanking(filters: any = {}): Promise<RankingEntry[]> {
    const currentYear = new Date().getFullYear();
    
    // Si se solicita un año específico, usar el historial
    if (filters.year && filters.year !== currentYear) {
      return this.getHistoricalRanking(filters.year);
    }

    // Obtener el ranking actual
    const ranking = await this.calculateRanking();

    // Aplicar filtros
    let filteredRanking = ranking;

    if (filters.regionId) {
      filteredRanking = filteredRanking.filter(entry => 
        entry.team.region.id === filters.regionId
      );
    }

    if (filters.surface) {
      // Este filtro requeriría lógica adicional para filtrar por superficie
      // Por ahora, retornamos el ranking completo
    }

    if (filters.modality) {
      // Este filtro requeriría lógica adicional para filtrar por modalidad
      // Por ahora, retornamos el ranking completo
    }

    // Aplicar paginación
    if (filters.limit) {
      const offset = filters.offset || 0;
      filteredRanking = filteredRanking.slice(offset, offset + filters.limit);
    }

    return filteredRanking;
  }

  /**
   * Obtiene el ranking histórico de un año específico
   */
  private async getHistoricalRanking(year: number): Promise<RankingEntry[]> {
    const history = await prisma.rankingHistory.findMany({
      where: { year },
      include: {
        team: {
          include: { region: true }
        }
      },
      orderBy: { rank: 'asc' }
    });

    return history.map(entry => ({
      rank: entry.rank,
      team: {
        id: entry.team.id,
        name: entry.team.name,
        club: entry.team.club || undefined,
        region: {
          id: entry.team.region.id,
          name: entry.team.region.name
        }
      },
      totalPoints: entry.points,
      yearBreakdown: entry.details as any
    }));
  }

  /**
   * Recalcula el ranking y actualiza la base de datos
   */
  public async recalculateRanking(): Promise<RankingEntry[]> {
    console.log('Iniciando recálculo del ranking...');
    
    try {
      const ranking = await this.calculateRanking();
      console.log(`Ranking recalculado exitosamente. ${ranking.length} equipos procesados.`);
      return ranking;
    } catch (error) {
      console.error('Error al recalcular el ranking:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas del ranking
   */
  public async getRankingStats(): Promise<any> {
    const currentYear = new Date().getFullYear();
    const ranking = await this.getRanking();

    const stats = {
      totalTeams: ranking.length,
      year: currentYear,
      lastUpdated: new Date(),
      topTeams: ranking.slice(0, 10),
      regionBreakdown: {} as any,
      averagePoints: 0
    };

    // Calcular promedio de puntos
    if (ranking.length > 0) {
      stats.averagePoints = ranking.reduce((sum, entry) => sum + entry.totalPoints, 0) / ranking.length;
    }

    // Desglose por regiones
    const regionMap = new Map();
    for (const entry of ranking) {
      const regionName = entry.team.region.name;
      if (!regionMap.has(regionName)) {
        regionMap.set(regionName, {
          name: entry.team.region.name,
          teams: 0,
          totalPoints: 0,
          averagePoints: 0
        });
      }
      
      const regionStats = regionMap.get(regionName);
      regionStats.teams++;
      regionStats.totalPoints += entry.totalPoints;
    }

    // Calcular promedios por región
    for (const [name, stats] of regionMap) {
      stats.averagePoints = stats.totalPoints / stats.teams;
      stats.regionBreakdown[name] = stats;
    }

    return stats;
  }
}
