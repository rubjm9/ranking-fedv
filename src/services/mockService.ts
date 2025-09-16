// Servicio mock para desarrollo cuando Supabase no está disponible
export const mockRegions = [
  {
    id: '1',
    name: 'Centro',
    coefficient: 1.0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    _count: {
      teams: 5,
      tournaments: 3
    }
  },
  {
    id: '2',
    name: 'Nordeste',
    coefficient: 0.9,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    _count: {
      teams: 4,
      tournaments: 2
    }
  },
  {
    id: '3',
    name: 'Sur',
    coefficient: 0.8,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    _count: {
      teams: 3,
      tournaments: 2
    }
  }
];

export const mockTeams = [
  {
    id: '1',
    name: 'Madrid Ultimate',
    regionId: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    regions: {
      name: 'Centro',
      coefficient: 1.0
    }
  },
  {
    id: '2',
    name: 'Barcelona Ultimate',
    regionId: '2',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    regions: {
      name: 'Nordeste',
      coefficient: 0.9
    }
  },
  {
    id: '3',
    name: 'Sevilla Ultimate',
    regionId: '3',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    regions: {
      name: 'Sur',
      coefficient: 0.8
    }
  },
  {
    id: '4',
    name: 'Valencia Ultimate',
    regionId: '2',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    regions: {
      name: 'Nordeste',
      coefficient: 0.9
    }
  },
  {
    id: '5',
    name: 'Toledo Ultimate',
    regionId: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    regions: {
      name: 'Centro',
      coefficient: 1.0
    }
  }
];

export const mockTournaments = [
  {
    id: '1',
    name: 'Campeonato España 2ª División Playa Mixto (2025/26)',
    type: 'CE2',
    year: 2025,
    surface: 'BEACH',
    modality: 'MIXED',
    regionId: null, // Torneo nacional
    region: null,
    startDate: '2025-06-15',
    endDate: '2025-06-17',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    positions: [
      {
        id: 'pos1',
        position: 1,
        points: 230,
        teamId: '1',
        tournamentId: '1',
        teams: {
          id: '1',
          name: 'Madrid Ultimate',
          region: { name: 'Centro' }
        }
      },
      {
        id: 'pos2',
        position: 2,
        points: 195,
        teamId: '2',
        tournamentId: '1',
        teams: {
          id: '2',
          name: 'Barcelona Ultimate',
          region: { name: 'Nordeste' }
        }
      },
      {
        id: 'pos3',
        position: 3,
        points: 165,
        teamId: '3',
        tournamentId: '1',
        teams: {
          id: '3',
          name: 'Sevilla Ultimate',
          region: { name: 'Sur' }
        }
      },
      {
        id: 'pos4',
        position: 4,
        points: 140,
        teamId: '4',
        tournamentId: '1',
        teams: {
          id: '4',
          name: 'Valencia Ultimate',
          region: { name: 'Nordeste' }
        }
      }
    ]
  },
  {
    id: '2',
    name: 'Campeonato Regional Centro Playa Mixto (2025/26)',
    type: 'REGIONAL',
    year: 2025,
    surface: 'BEACH',
    modality: 'MIXED',
    regionId: '1',
    region: { id: '1', name: 'Centro', coefficient: 1.0 },
    startDate: '2025-05-10',
    endDate: '2025-05-12',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    positions: [
      {
        id: 'pos5',
        position: 1,
        points: 200,
        teamId: '1',
        tournamentId: '2',
        teams: {
          id: '1',
          name: 'Madrid Ultimate',
          region: { name: 'Centro' }
        }
      },
      {
        id: 'pos6',
        position: 2,
        points: 180,
        teamId: '5',
        tournamentId: '2',
        teams: {
          id: '5',
          name: 'Toledo Ultimate',
          region: { name: 'Centro' }
        }
      }
    ]
  }
];

// Función para simular delay de API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockRegionsService = {
  getAll: async () => {
    await delay(500);
    return { success: true, data: mockRegions };
  },
  getById: async (id: string) => {
    await delay(300);
    const region = mockRegions.find(r => r.id === id);
    return { success: true, data: region };
  }
};

export const mockTeamsService = {
  getAll: async () => {
    await delay(500);
    return { success: true, data: mockTeams };
  },
  getById: async (id: string) => {
    await delay(300);
    const team = mockTeams.find(t => t.id === id);
    return { success: true, data: team };
  }
};

export const mockTournamentsService = {
  getAll: async () => {
    await delay(500);
    return { success: true, data: mockTournaments };
  },
  getById: async (id: string) => {
    await delay(300);
    const tournament = mockTournaments.find(t => t.id === id);
    return { success: true, data: tournament };
  }
};
