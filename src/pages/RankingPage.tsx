import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Filter, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Users,
  MapPin,
  Calendar,
  Trophy
} from 'lucide-react'

const RankingPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState('2024')
  const [selectedRegion, setSelectedRegion] = useState('all')

  // Mock data - en producción vendría de la API
  const rankingData = [
    {
      id: 1,
      position: 1,
      team: 'Madrid Ultimate Club',
      region: 'Madrid',
      points: 2847.5,
      change: 0,
      previousPosition: 1,
      tournaments: 8,
      lastTournament: 'CE1 Madrid 2024'
    },
    {
      id: 2,
      position: 2,
      team: 'Barcelona Ultimate',
      region: 'Cataluña',
      points: 2654.2,
      change: 1,
      previousPosition: 3,
      tournaments: 7,
      lastTournament: 'CE1 Barcelona 2024'
    },
    {
      id: 3,
      position: 3,
      team: 'Valencia Frisbee',
      region: 'Valencia',
      points: 2489.8,
      change: -1,
      previousPosition: 2,
      tournaments: 6,
      lastTournament: 'CE2 Valencia 2024'
    },
    {
      id: 4,
      position: 4,
      team: 'Sevilla Ultimate',
      region: 'Andalucía',
      points: 2234.1,
      change: 2,
      previousPosition: 6,
      tournaments: 5,
      lastTournament: 'Regional Sevilla 2024'
    },
    {
      id: 5,
      position: 5,
      team: 'Bilbao Frisbee',
      region: 'País Vasco',
      points: 1987.6,
      change: -1,
      previousPosition: 4,
      tournaments: 6,
      lastTournament: 'CE2 Bilbao 2024'
    }
  ]

  const filters = [
    { id: 'all', name: 'Todos', icon: Trophy },
    { id: 'ce1', name: 'CE1', icon: Trophy },
    { id: 'ce2', name: 'CE2', icon: Trophy },
    { id: 'regional', name: 'Regional', icon: Trophy }
  ]

  const years = ['2024', '2023', '2022', '2021']
  const regions = [
    { id: 'all', name: 'Todas las regiones' },
    { id: 'madrid', name: 'Madrid' },
    { id: 'cataluna', name: 'Cataluña' },
    { id: 'valencia', name: 'Valencia' },
    { id: 'andalucia', name: 'Andalucía' },
    { id: 'pais-vasco', name: 'País Vasco' }
  ]

  const getPositionChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getPositionChangeText = (change: number) => {
    if (change > 0) {
      return `+${change}`
    } else if (change < 0) {
      return `${change}`
    } else {
      return '0'
    }
  }

  const filteredData = rankingData.filter(team => {
    const matchesSearch = team.team.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = selectedRegion === 'all' || (team.region as any)?.name?.toLowerCase().includes(selectedRegion.toLowerCase()) || team.region?.toLowerCase().includes(selectedRegion.toLowerCase())
    return matchesSearch && matchesRegion
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ranking FEDV
          </h1>
          <p className="text-gray-600">
            Clasificación oficial de equipos de Ultimate Frisbee en España
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card text-center">
            <Users className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">156</p>
            <p className="text-sm text-gray-600">Equipos registrados</p>
          </div>
          
          <div className="card text-center">
            <MapPin className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">17</p>
            <p className="text-sm text-gray-600">Regiones activas</p>
          </div>
          
          <div className="card text-center">
            <Calendar className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">23</p>
            <p className="text-sm text-gray-600">Torneos este año</p>
          </div>
          
          <div className="card text-center">
            <Trophy className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">Hace 2h</p>
            <p className="text-sm text-gray-600">Última actualización</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Filter Tabs */}
            <div className="flex space-x-1">
              {filters.map((filter) => {
                const Icon = filter.icon
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      activeFilter === filter.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {filter.name}
                  </button>
                )
              })}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar equipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Year Filter */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              {/* Region Filter */}
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {regions.map(region => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ranking Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posición
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Región
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puntos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cambio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Torneos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último torneo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((team) => (
                  <tr key={team.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          team.position === 1 ? 'bg-yellow-100 text-yellow-800' :
                          team.position === 2 ? 'bg-gray-100 text-gray-800' :
                          team.position === 3 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-700'
                        }`}>
                          {team.position}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/teams/${team.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-500"
                      >
                        {team.team}
                      </Link>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/regions/${team.region?.id || team.region?.name?.toLowerCase().replace(' ', '-')}`}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        {team.region?.name || team.region || 'Sin región'}
                      </Link>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {team.points.toFixed(1)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getPositionChangeIcon(team.change)}
                        <span className={`ml-1 text-sm ${
                          team.change > 0 ? 'text-green-600' :
                          team.change < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {getPositionChangeText(team.change)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{team.tournaments}</span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{team.lastTournament}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">1</span> a <span className="font-medium">5</span> de <span className="font-medium">156</span> equipos
          </div>
          
          <div className="flex space-x-2">
            <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Anterior
            </button>
            <button className="px-3 py-2 text-sm font-medium text-white bg-primary-600 border border-primary-600 rounded-lg">
              1
            </button>
            <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              3
            </button>
            <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RankingPage
