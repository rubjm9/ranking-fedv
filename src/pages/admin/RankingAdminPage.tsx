import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  RefreshCw, 
  Download, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  Search,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

interface Team {
  id: string
  name: string
  region: {
    id: string
    name: string
    code: string
  }
  points: number
  rank: number
  previousRank: number
  change: number
  tournaments: number
  lastUpdate: string
}

interface Tournament {
  id: string
  name: string
  year: number
  type: string
  teams: number
}

const RankingAdminPage: React.FC = () => {
  const navigate = useNavigate()
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [position, setPosition] = useState(1)

  // Mock data - en producción vendría de la API
  const [teams] = useState<Team[]>([
    {
      id: '1',
      name: 'Madrid Ultimate Club',
      region: {
        id: 'madrid',
        name: 'Madrid',
        code: 'MAD'
      },
      points: 1250.5,
      rank: 1,
      previousRank: 1,
      change: 0,
      tournaments: 8,
      lastUpdate: '2024-09-02'
    },
    {
      id: '2',
      name: 'Barcelona Flying Disc',
      region: {
        id: 'cataluna',
        name: 'Cataluña',
        code: 'CAT'
      },
      points: 1180.3,
      rank: 2,
      previousRank: 3,
      change: 1,
      tournaments: 7,
      lastUpdate: '2024-09-02'
    },
    {
      id: '3',
      name: 'Valencia Ultimate',
      region: {
        id: 'valencia',
        name: 'Valencia',
        code: 'VAL'
      },
      points: 1150.8,
      rank: 3,
      previousRank: 2,
      change: -1,
      tournaments: 6,
      lastUpdate: '2024-09-02'
    },
    {
      id: '4',
      name: 'Sevilla Ultimate',
      region: {
        id: 'andalucia',
        name: 'Andalucía',
        code: 'AND'
      },
      points: 1020.2,
      rank: 4,
      previousRank: 4,
      change: 0,
      tournaments: 5,
      lastUpdate: '2024-09-02'
    },
    {
      id: '5',
      name: 'Bilbao Frisbee',
      region: {
        id: 'pais-vasco',
        name: 'País Vasco',
        code: 'PV'
      },
      points: 980.7,
      rank: 5,
      previousRank: 6,
      change: 1,
      tournaments: 6,
      lastUpdate: '2024-09-02'
    }
  ])

  const [tournaments] = useState<Tournament[]>([
    { id: '1', name: 'CE1 2024', year: 2024, type: 'CE1', teams: 24 },
    { id: '2', name: 'CE2 2024', year: 2024, type: 'CE2', teams: 18 },
    { id: '3', name: 'Regional Madrid 2024', year: 2024, type: 'REGIONAL', teams: 12 },
    { id: '4', name: 'Regional Cataluña 2024', year: 2024, type: 'REGIONAL', teams: 15 }
  ])

  const regions = [
    { id: 'all', name: 'Todas' },
    { id: 'madrid', name: 'Madrid' },
    { id: 'cataluna', name: 'Cataluña' },
    { id: 'valencia', name: 'Valencia' },
    { id: 'andalucia', name: 'Andalucía' },
    { id: 'pais-vasco', name: 'País Vasco' }
  ]

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = selectedRegion === 'all' || team.region?.id === selectedRegion
    return matchesSearch && matchesRegion
  })

  const handleRecalculate = async () => {
    setIsRecalculating(true)
    try {
      // Mock API call - en producción sería una llamada real
      await new Promise(resolve => setTimeout(resolve, 3000))
      toast.success('Ranking recalculado exitosamente')
    } catch (error) {
      console.error('Error al recalcular ranking:', error)
      toast.error('Error al recalcular el ranking')
    } finally {
      setIsRecalculating(false)
    }
  }

  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      if (format === 'csv') {
        // Exportar CSV directamente desde el frontend
        const csvContent = generateCSV()
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `ranking-fedv-${format}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        toast.success(`Ranking exportado exitosamente en formato ${format.toUpperCase()}`)
      } else {
        // Para Excel, generar directamente en frontend usando XLSX
        try {
          const excelData = generateExcelData()
          const ws = XLSX.utils.json_to_sheet(excelData)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, 'Ranking')
          
          // Generar el archivo Excel
          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
          const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
          
          // Crear y descargar el archivo
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `ranking-fedv-${format}-${new Date().toISOString().split('T')[0]}.xlsx`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          
          toast.success(`Ranking exportado exitosamente en formato ${format.toUpperCase()}`)
        } catch (error) {
          console.error('Error al exportar Excel:', error)
          toast.error('Error al exportar Excel. Intentando generar CSV...')
          
          // Fallback a CSV si Excel falla
          const csvContent = generateCSV()
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `ranking-fedv-csv-${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          
          toast.success('Archivo exportado en formato CSV como alternativa')
        }
      }
    } catch (error: any) {
      console.error('Error al exportar ranking:', error)
      toast.error(error.response?.data?.message || 'Error al exportar el ranking')
    }
  }

  const generateCSV = () => {
    const csvRows: string[] = []
    
    // Encabezados
    csvRows.push('Posición,Equipo,Región,Puntos,Cambio,Torneos,Última Actualización')
    
    // Datos de equipos
    filteredTeams.forEach((team) => {
      csvRows.push(`${team.rank},${team.name},${team.region?.name || 'Sin región'},${team.points.toFixed(1)},${getChangeText(team.change)},${team.tournaments},${team.lastUpdate}`)
    })
    
    return csvRows.join('\n')
  }

  const generateExcelData = () => {
    return filteredTeams.map((team) => ({
      'Posición': team.rank,
      'Equipo': team.name,
      'Región': team.region?.name || 'Sin región',
      'Puntos': team.points.toFixed(1),
      'Cambio': getChangeText(team.change),
      'Torneos': team.tournaments,
      'Última Actualización': team.lastUpdate
    }))
  }

  const handleAddPosition = async () => {
    if (!selectedTeam || !selectedTournament) return

    try {
      // Mock API call - en producción sería una llamada real
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(`Posición ${position} añadida para ${selectedTeam.name} en ${selectedTournament.name}`)
      setShowPositionModal(false)
      setSelectedTeam(null)
      setSelectedTournament(null)
      setPosition(1)
    } catch (error) {
      console.error('Error al añadir posición:', error)
      toast.error('Error al añadir la posición')
    }
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
    return <BarChart3 className="h-4 w-4 text-gray-400" />
  }

  const getChangeText = (change: number) => {
    if (change > 0) return `+${change}`
    if (change < 0) return `${change}`
    return '-'
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Administración del Ranking</h1>
            <p className="text-gray-600">Gestionar y mantener el ranking de equipos</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleExport('excel')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </button>
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isRecalculating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Recalculando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recalcular Ranking
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Torneos Activos</p>
              <p className="text-2xl font-bold text-gray-900">{tournaments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Última Actualización</p>
              <p className="text-2xl font-bold text-gray-900">Hace 2h</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cambios Hoy</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar equipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {regions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowPositionModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir Posición
          </button>
        </div>
      </div>

      {/* Ranking Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Ranking Actual</h3>
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
                  Puntos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cambio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Torneos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Actualización
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeams.map((team) => (
                <tr key={team.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{team.rank}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{team.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{team.region?.name || 'Sin región'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{team.points.toFixed(1)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getChangeIcon(team.change)}
                      <span className={`ml-1 text-sm font-medium ${
                        team.change > 0 ? 'text-green-600' : 
                        team.change < 0 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {getChangeText(team.change)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{team.tournaments}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{team.lastUpdate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => navigate(`/teams/${team.id}`)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => navigate(`/admin/teams/${team.id}/edit`)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedTeam(team)
                          setShowDeleteModal(true)
                        }}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Position Modal */}
      {showPositionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Añadir Posición</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipo
                  </label>
                  <select
                    value={selectedTeam?.id || ''}
                    onChange={(e) => {
                      const team = teams.find(t => t.id === e.target.value)
                      setSelectedTeam(team || null)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar equipo</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Torneo
                  </label>
                  <select
                    value={selectedTournament?.id || ''}
                    onChange={(e) => {
                      const tournament = tournaments.find(t => t.id === e.target.value)
                      setSelectedTournament(tournament || null)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar torneo</option>
                    {tournaments.map(tournament => (
                      <option key={tournament.id} value={tournament.id}>{tournament.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posición
                  </label>
                  <input
                    type="number"
                    value={position}
                    onChange={(e) => setPosition(parseInt(e.target.value) || 1)}
                    min="1"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowPositionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddPosition}
                  disabled={!selectedTeam || !selectedTournament}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Añadir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mt-4">
                Eliminar Equipo
              </h3>
              <p className="text-sm text-gray-500 text-center mt-2">
                ¿Estás seguro de que quieres eliminar <strong>{selectedTeam?.name}</strong>? 
                Esta acción no se puede deshacer.
              </p>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // Mock delete - en producción sería una llamada real
                    toast.success(`Equipo ${selectedTeam?.name} eliminado exitosamente`)
                    setShowDeleteModal(false)
                    setSelectedTeam(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RankingAdminPage
