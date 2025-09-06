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
  }
];

export const mockTournaments = [
  {
    id: '1',
    name: 'Copa de España 2024',
    type: 'CE1',
    year: 2024,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Campeonato Regional Centro',
    type: 'REGIONAL',
    year: 2024,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
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
