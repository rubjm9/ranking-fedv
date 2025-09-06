import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Trophy, MapPin, Users, Filter, Search, ChevronRight, Crown, Medal, Award, Loader2 } from 'lucide-react'
import { tournamentsService } from '@/services/apiService'

const TournamentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSurface, setSelectedSurface] = useState('')
  const [selectedModality, setSelectedModality] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const tournamentsPerPage = 9

  // Obtener torneos desde la API
  const { data: tournamentsData, isLoading, error } = useQuery({
    queryKey: ['tournaments', searchTerm, selectedType, selectedYear, selectedSurface, selectedModality],
    queryFn: () => tournamentsService.getAll({
      search: searchTerm || undefined,
      type: selectedType || undefined,
      year: selectedYear ? parseInt(selectedYear) : undefined
    })
  })

  const tournaments = tournamentsData?.data || []

  // Filtrar torneos
  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !selectedType || tournament.type === selectedType
    const matchesYear = !selectedYear || tournament.year.toString() === selectedYear
    const matchesSurface = !selectedSurface || tournament.surface === selectedSurface
    const matchesModality = !selectedModality || tournament.modality === selectedModality
    return matchesSearch && matchesType && matchesYear && matchesSurface && matchesModality
  })

  // Paginación
  const totalPages = Math.ceil(filteredTournaments.length / tournamentsPerPage)
  const startIndex = (currentPage - 1) * tournamentsPerPage
  const paginatedTournaments = filteredTournaments.slice(startIndex, startIndex + tournamentsPerPage)

  // Obtener valores únicos para filtros
  const types = Array.from(new Set(tournaments.map(t => t.type))).filter(Boolean)
  const years = Array.from(new Set(tournaments.map(t => t.year))).sort((a, b) => b - a)
  const surfaces = Array.from(new Set(tournaments.map(t => t.surface))).filter(Boolean)
  const modalities = Array.from(new Set(tournaments.map(t => t.modality))).filter(Boolean)

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CE1': return 'CE1 - 1ª División'
      case 'CE2': return 'CE2 - 2ª División'
      case 'REGIONAL': return 'Regional'
      default: return type
    }
  }

  const getSurfaceLabel = (surface: string) => {
    switch (surface) {
      case 'GRASS': return 'Hierba'
      case 'BEACH': return 'Playa'
      case 'INDOOR': return 'Interior'
      default: return surface
    }
  }

  const getModalityLabel = (modality: string) => {
    switch (modality) {
      case 'OPEN': return 'Open'
      case 'WOMEN': return 'Femenino'
      case 'MIXED': return 'Mixto'
      default: return modality
    }
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">Error al cargar los torneos</div>
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Torneos</h1>
        <p className="text-xl text-gray-600">
          Explora todos los torneos del Ranking FEDV
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Torneos</p>
              <p className="text-2xl font-bold text-gray-900">{tournaments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Año Actual</p>
              <p className="text-2xl font-bold text-gray-900">2024</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Regiones</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(tournaments.map(t => t.region?.name)).size}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Modalidades</p>
              <p className="text-2xl font-bold text-gray-900">{modalities.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar torneos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los tipos</option>
            {types.map(type => (
              <option key={type} value={type}>{getTypeLabel(type)}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los años</option>
            {years.map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>
          <select
            value={selectedSurface}
            onChange={(e) => setSelectedSurface(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las superficies</option>
            {surfaces.map(surface => (
              <option key={surface} value={surface}>{getSurfaceLabel(surface)}</option>
            ))}
          </select>
          <select
            value={selectedModality}
            onChange={(e) => setSelectedModality(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las modalidades</option>
            {modalities.map(modality => (
              <option key={modality} value={modality}>{getModalityLabel(modality)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de torneos */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {paginatedTournaments.map((tournament) => (
              <Link
                key={tournament.id}
                to={`/tournaments/${tournament.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-6 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {tournament.name}
                      </h3>
                      <p className="text-sm text-gray-600">{tournament.year}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tipo:</span>
                    <span className="text-sm font-medium text-blue-600">
                      {getTypeLabel(tournament.type)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Superficie:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {getSurfaceLabel(tournament.surface)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Modalidad:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {getModalityLabel(tournament.modality)}
                    </span>
                  </div>

                  {tournament.region && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Región:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {tournament.region.name}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
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

export default TournamentsPage
