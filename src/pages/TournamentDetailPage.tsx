import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Trophy, Users, BarChart3, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface Tournament {
  id: string
  name: string
  year: number
  type: string
  surface: string
  modality: string
  region: string
  regionCode: string
  status: 'upcoming' | 'ongoing' | 'completed'
  startDate: string
  endDate: string
  description: string
  teams: number
  totalPoints: number
}

interface TeamPosition {
  id: string
  position: number
  team: {
    id: string
    name: string
    region: string
    logo: string
  }
  points: number
  coefficient: number
}

interface RegionStats {
  name: string
  teams: number
  percentage: number
  color: string
}

const TournamentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [isLoading, setIsLoading] = useState(false)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [positions, setPositions] = useState<TeamPosition[]>([])
  const [regionStats, setRegionStats] = useState<RegionStats[]>([])

  // Mock data - en producción vendría de la API
  const mockTournament: Tournament = {
    id: '1',
    name: 'Campeonato España 1ª División 2024',
    year: 2024,
    type: 'CE1',
    surface: 'GRASS',
    modality: 'OPEN',
    region: 'Madrid',
    regionCode: 'MAD',
    status: 'completed',
    startDate: '2024-06-15',
    endDate: '2024-06-17',
    description: 'El torneo más importante del año para equipos de primera división. Celebrado en Madrid con la participación de los mejores equipos del país.',
    teams: 24,
    totalPoints: 4800
  }

  const mockPositions: TeamPosition[] = [
    { id: '1', position: 1, team: { id: '1', name: 'Madrid Ultimate Club', region: 'Madrid', logo: 'https://via.placeholder.com/40' }, points: 200, coefficient: 1.2 },
    { id: '2', position: 2, team: { id: '2', name: 'Barcelona Frisbee', region: 'Cataluña', logo: 'https://via.placeholder.com/40' }, points: 180, coefficient: 1.15 },
    { id: '3', position: 3, team: { id: '3', name: 'Valencia Ultimate', region: 'Valencia', logo: 'https://via.placeholder.com/40' }, points: 160, coefficient: 1.05 },
    { id: '4', position: 4, team: { id: '4', name: 'Sevilla Disc Golf', region: 'Andalucía', logo: 'https://via.placeholder.com/40' }, points: 140, coefficient: 0.95 },
    { id: '5', position: 5, team: { id: '5', name: 'Bilbao Frisbee', region: 'País Vasco', logo: 'https://via.placeholder.com/40' }, points: 120, coefficient: 1.0 }
  ]

  const mockRegionStats: RegionStats[] = [
    { name: 'Madrid', teams: 8, percentage: 33.3, color: '#3B82F6' },
    { name: 'Cataluña', teams: 6, percentage: 25.0, color: '#EF4444' },
    { name: 'Valencia', teams: 4, percentage: 16.7, color: '#10B981' },
    { name: 'Andalucía', teams: 3, percentage: 12.5, color: '#F59E0B' },
    { name: 'País Vasco', teams: 2, percentage: 8.3, color: '#8B5CF6' },
    { name: 'Otros', teams: 1, percentage: 4.2, color: '#6B7280' }
  ]

  useEffect(() => {
    loadTournamentData()
  }, [id])

  const loadTournamentData = async () => {
    setIsLoading(true)
    try {
      // Mock API call - en producción sería una llamada real
      await new Promise(resolve => setTimeout(resolve, 500))
      setTournament(mockTournament)
      setPositions(mockPositions)
      setRegionStats(mockRegionStats)
    } catch (error) {
      console.error('Error al cargar datos del torneo:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CE1': return 'Campeonato España 1ª División'
      case 'CE2': return 'Campeonato España 2ª División'
      case 'REGIONAL': return 'Campeonato Regional'
      default: return type
    }
  }

  const getSurfaceLabel = (surface: string) => {
    switch (surface) {
      case 'GRASS': return 'Césped'
      case 'BEACH': return 'Playa'
      case 'INDOOR': return 'Indoor'
      default: return surface
    }
  }

  const getModalityLabel = (modality: string) => {
    switch (modality) {
      case 'OPEN': return 'Open'
      case 'MIXED': return 'Mixto'
      case 'WOMEN': return 'Women'
      default: return modality
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Próximo'
      case 'ongoing': return 'En curso'
      case 'completed': return 'Completado'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'ongoing': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPositionColor = (position: number) => {
    if (position === 1) return 'bg-yellow-100 text-yellow-800'
    if (position === 2) return 'bg-gray-100 text-gray-800'
    if (position === 3) return 'bg-orange-100 text-orange-800'
    return 'bg-blue-100 text-blue-800'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Cargando torneo...</span>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Torneo no encontrado</h2>
        <p className="text-gray-600 mt-2">El torneo que buscas no existe o ha sido eliminado.</p>
        <Link to="/" className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center">
          <Link
            to="/"
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tournament.name}</h1>
            <p className="text-gray-600">{getTypeLabel(tournament.type)}</p>
          </div>
        </div>
      </div>

      {/* Tournament Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Año</p>
              <p className="text-2xl font-bold text-gray-900">{tournament.year}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Equipos</p>
              <p className="text-2xl font-bold text-gray-900">{tournament.teams}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Puntos Totales</p>
              <p className="text-2xl font-bold text-gray-900">{tournament.totalPoints}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Trophy className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Estado</p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tournament.status)}`}>
                {getStatusLabel(tournament.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tournament Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Tournament Description */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sobre el Torneo</h3>
            <p className="text-gray-600 leading-relaxed mb-6">{tournament.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Detalles del Torneo</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Tipo:</span>
                    <span className="font-medium">{getTypeLabel(tournament.type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Superficie:</span>
                    <span className="font-medium">{getSurfaceLabel(tournament.surface)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Modalidad:</span>
                    <span className="font-medium">{getModalityLabel(tournament.modality)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Región:</span>
                    <span className="font-medium">{(tournament.region as any)?.name || tournament.region || 'Sin región'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Fechas</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Inicio:</span>
                    <span className="font-medium">{tournament.startDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fin:</span>
                    <span className="font-medium">{tournament.endDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Region Distribution Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución por Regiones</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={regionStats}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="teams"
              >
                {regionStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {regionStats.map((region, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: region.color }}
                  ></div>
                  <span className="text-gray-600">{region.name}</span>
                </div>
                <span className="font-medium">{region.teams} equipos</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Resultados Finales</h3>
        </div>
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
                  Coeficiente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntos
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {positions.map((position) => (
                <tr key={position.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPositionColor(position.position)}`}>
                      {position.position}º
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/teams/${position.team.id}`}
                      className="flex items-center text-sm font-medium text-gray-900 hover:text-primary-600"
                    >
                      {position.team.logo && (
                        <img
                          src={position.team.logo}
                          alt={`Logo de ${position.team.name}`}
                          className="w-8 h-8 rounded mr-3"
                        />
                      )}
                      {position.team.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{(position.team.region as any)?.name || position.team.region || 'Sin región'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{position.coefficient}x</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{position.points}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TournamentDetailPage
