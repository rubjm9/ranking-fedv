/**
 * Servicio de datos mock para desarrollo y testing
 */

// Servicio mock para regiones
export const mockRegionsService = {
  async getRegions() {
    return [
      { id: '1', name: 'Madrid', code: 'MAD' },
      { id: '2', name: 'Cataluña', code: 'CAT' },
      { id: '3', name: 'Andalucía', code: 'AND' },
      { id: '4', name: 'Canarias', code: 'CAN' }
    ]
  }
}

// Servicio mock para equipos
export const mockTeamsService = {
  async getTeams() {
    return [
      { id: '1', name: 'Equipo Mock 1', region_id: '1' },
      { id: '2', name: 'Equipo Mock 2', region_id: '2' },
      { id: '3', name: 'Equipo Mock 3', region_id: '3' }
    ]
  }
}

// Servicio mock para torneos
export const mockTournamentsService = {
  async getTournaments() {
    return [
      { 
        id: '1', 
        name: 'Torneo Mock 1', 
        season: '2024-25',
        category: 'beach_mixed',
        date: '2024-10-15'
      },
      { 
        id: '2', 
        name: 'Torneo Mock 2', 
        season: '2024-25',
        category: 'beach_open',
        date: '2024-11-20'
      }
    ]
  }
}
