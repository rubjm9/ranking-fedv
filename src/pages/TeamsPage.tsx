import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, Users, MapPin, Trophy, ChevronUp, ChevronDown, Loader2, ArrowUpDown } from 'lucide-react'
import { teamsService, regionsService } from '@/services/apiService'
import TeamLogo from '@/components/ui/TeamLogo'

const TeamsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<keyof any>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const teamsPerPage = 20

  // Obtener equipos desde la API
  const { data: teamsData, isLoading, error } = useQuery({
    queryKey: ['teams', searchTerm, selectedRegion],
    queryFn: () => teamsService.getAll({
      search: searchTerm || undefined,
      region: selectedRegion || undefined
    })
  })

  // Obtener regiones desde la API
  const { data: regionsData } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsService.getAll()
  })

  const teams = teamsData?.data || []

  // Función para calcular puntos totales de un equipo
  const getTeamTotalPoints = (team: any) => {
    if (!team.positions || team.positions.length === 0) return 0
    return team.positions.reduce((total: number, position: any) => total + (position.points || 0), 0)
  }

  // Filtrar y ordenar equipos
  const filteredAndSortedTeams = useMemo(() => {
    let filtered = teams.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           team.location?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRegion = !selectedRegion || team.region?.id === selectedRegion
      return matchesSearch && matchesRegion
    })

    // Ordenar
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]
      
      // Manejar valores anidados
      if (sortField === 'region') {
        aValue = a.region?.name || ''
        bValue = b.region?.name || ''
      } else if (sortField === 'points') {
        aValue = getTeamTotalPoints(a)
        bValue = getTeamTotalPoints(b)
      }
      
      // Para puntos, comparar numéricamente
      if (sortField === 'points') {
        if (sortDirection === 'asc') {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      }
      
      // Para otros campos, convertir a string para comparación
      aValue = String(aValue || '').toLowerCase()
      bValue = String(bValue || '').toLowerCase()
      
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue)
      }
    })

    return filtered
  }, [teams, searchTerm, selectedRegion, sortField, sortDirection])

  // Paginación
  const totalPages = Math.ceil(filteredAndSortedTeams.length / teamsPerPage)
  const startIndex = (currentPage - 1) * teamsPerPage
  const paginatedTeams = filteredAndSortedTeams.slice(startIndex, startIndex + teamsPerPage)

  // Regiones únicas para el filtro (ya no se usa, pero mantenemos para compatibilidad)
  const regions = Array.from(new Set(teams.map(team => team.region?.name))).filter(Boolean)

  // Función para manejar el ordenamiento
  const handleSort = (field: keyof any) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Función para obtener el icono de ordenamiento
  const getSortIcon = (field: keyof any) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">Error al cargar los equipos</div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Equipos</h1>
        <p className="text-xl text-gray-600">
          Descubre todos los equipos participantes en el Ranking FEDV
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Equipos</p>
              <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Regiones</p>
              <p className="text-2xl font-bold text-gray-900">{regionsData?.data?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Trophy className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Torneos Activos</p>
              <p className="text-2xl font-bold text-gray-900">10</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar equipos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las regiones</option>
            {regionsData?.data?.map(region => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de equipos */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Equipo</span>
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('region')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Región</span>
                        {getSortIcon('region')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('points')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Puntos</span>
                        {getSortIcon('points')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTeams.map((team) => (
                    <tr 
                      key={team.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => window.location.href = `/teams/${team.id}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <TeamLogo 
                            logo={team.logo} 
                            name={team.name} 
                            size="sm"
                            className="mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {team.name}
                            </div>
                            {team.isFilial && (
                              <div className="text-xs text-blue-600">
                                Equipo filial
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {team.region?.name || 'Sin región'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {team.location || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getTeamTotalPoints(team).toFixed(1)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default TeamsPage
