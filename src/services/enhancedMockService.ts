// Servicio mock mejorado con datos más realistas
export const enhancedMockRegions = [
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
  },
  {
    id: '4',
    name: 'Norte',
    coefficient: 0.7,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    _count: {
      teams: 2,
      tournaments: 1
    }
  },
  {
    id: '5',
    name: 'Canarias',
    coefficient: 0.6,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    _count: {
      teams: 1,
      tournaments: 1
    }
  }
];

export const enhancedMockTeams = [
  {
    id: '1',
    name: 'Madrid Ultimate',
    regionId: '1',
    email: 'madrid@ultimate.es',
    logo: null,
    isFilial: false,
    parentTeamId: null,
    hasDifferentNames: false,
    nameOpen: null,
    nameWomen: null,
    nameMixed: null,
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
    email: 'barcelona@ultimate.es',
    logo: null,
    isFilial: false,
    parentTeamId: null,
    hasDifferentNames: false,
    nameOpen: null,
    nameWomen: null,
    nameMixed: null,
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
    email: 'sevilla@ultimate.es',
    logo: null,
    isFilial: false,
    parentTeamId: null,
    hasDifferentNames: false,
    nameOpen: null,
    nameWomen: null,
    nameMixed: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    regions: {
      name: 'Sur',
      coefficient: 0.8
    }
  },
  {
    id: '4',
    name: 'Alcalá Frisbee',
    regionId: '1',
    email: 'alcala@frisbee.es',
    logo: null,
    isFilial: false,
    parentTeamId: null,
    hasDifferentNames: false,
    nameOpen: null,
    nameWomen: null,
    nameMixed: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    regions: {
      name: 'Centro',
      coefficient: 1.0
    }
  },
  {
    id: '5',
    name: 'Girona Frisbee',
    regionId: '2',
    email: 'girona@frisbee.es',
    logo: null,
    isFilial: false,
    parentTeamId: null,
    hasDifferentNames: false,
    nameOpen: null,
    nameWomen: null,
    nameMixed: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    regions: {
      name: 'Nordeste',
      coefficient: 0.9
    }
  }
];

export const enhancedMockTournaments = [
  {
    id: '1',
    name: 'Copa de España 2024',
    type: 'CE1',
    year: 2024,
    regionId: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    regions: {
      name: 'Centro'
    }
  },
  {
    id: '2',
    name: 'Campeonato Regional Centro',
    type: 'REGIONAL',
    year: 2024,
    regionId: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    regions: {
      name: 'Centro'
    }
  },
  {
    id: '3',
    name: 'Torneo Nordeste 2024',
    type: 'REGIONAL',
    year: 2024,
    regionId: '2',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    regions: {
      name: 'Nordeste'
    }
  },
  {
    id: '4',
    name: 'Copa Sur 2024',
    type: 'REGIONAL',
    year: 2024,
    regionId: '3',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    regions: {
      name: 'Sur'
    }
  }
];

// Función para simular delay de API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const enhancedMockRegionsService = {
  getAll: async () => {
    await delay(500);
    return { success: true, data: enhancedMockRegions };
  },
  getById: async (id: string) => {
    await delay(300);
    const region = enhancedMockRegions.find(r => r.id === id);
    return { success: true, data: region };
  }
};

export const enhancedMockTeamsService = {
  getAll: async () => {
    await delay(500);
    return { success: true, data: enhancedMockTeams };
  },
  getById: async (id: string) => {
    await delay(300);
    const team = enhancedMockTeams.find(t => t.id === id);
    return { success: true, data: team };
  }
};

export const enhancedMockTournamentsService = {
  getAll: async () => {
    await delay(500);
    return { success: true, data: enhancedMockTournaments };
  },
  getById: async (id: string) => {
    await delay(300);
    const tournament = enhancedMockTournaments.find(t => t.id === id);
    return { success: true, data: tournament };
  }
};
