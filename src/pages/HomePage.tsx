import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Trophy, Users, MapPin, Calendar, TrendingUp, TrendingDown, BarChart3, Eye, Award, Target, Clock, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { homePageService, HomePageTeam, HomePageRegion, HomePageTournament, HomePageStats, RankingHistory } from '@/services/homePageService'
import TeamLogo from '@/components/ui/TeamLogo'

const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [teams, setTeams] = useState<HomePageTeam[]>([])
  const [regions, setRegions] = useState<HomePageRegion[]>([])
  const [recentTournaments, setRecentTournaments] = useState<HomePageTournament[]>([])
  const [rankingHistory, setRankingHistory] = useState<RankingHistory[]>([])
  const [mainStats, setMainStats] = useState<HomePageStats>({
    totalTeams: 0,
    totalTournaments: 0,
    totalRegions: 0,
    averagePoints: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Cargar todos los datos en paralelo
      const [teamsData, regionsData, tournamentsData, statsData, historyData] = await Promise.all([
        homePageService.getTopTeams(10),
        homePageService.getRegions(),
        homePageService.getRecentTournaments(4),
        homePageService.getMainStats(),
        homePageService.getRankingHistory()
      ])

      setTeams(teamsData)
      setRegions(regionsData)
      setRecentTournaments(tournamentsData)
      setMainStats(statsData)
      setRankingHistory(historyData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar equipos
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = selectedRegion === 'all' || team.regionCode === selectedRegion
    return matchesSearch && matchesRegion
  })

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <BarChart3 className="h-4 w-4 text-gray-400" />
  }

  const getChangeText = (change: number) => {
    if (change > 0) return `+${change}`
    if (change < 0) return `${change}`
    return '-'
  }

  const getTournamentTypeLabel = (type: string) => {
    switch (type) {
      case 'CE1': return 'CE1'
      case 'CE2': return 'CE2'
      case 'REGIONAL': return 'Regional'
      case 'INTERNATIONAL': return 'Internacional'
      default: return type
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Próximo'
      case 'ongoing': return 'En curso'
      case 'completed': return 'Completado'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Cargando datos...</span>
        </div>
      ) : (
        <>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Ranking FEDV
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              El ranking oficial de Ultimate Frisbee en España
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/ranking"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Ver Ranking Completo
              </Link>
              <Link
                to="/teams"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
              >
                Explorar Equipos
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Equipos Activos</p>
                <p className="text-2xl font-bold text-gray-900">{mainStats.totalTeams}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Torneos 2024</p>
                <p className="text-2xl font-bold text-gray-900">{mainStats.totalTournaments}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Regiones</p>
                <p className="text-2xl font-bold text-gray-900">{mainStats.totalRegions}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Promedio Puntos</p>
                <p className="text-2xl font-bold text-gray-900">{mainStats.averagePoints.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* How Ranking Works Section */}
        <div className="mb-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">¿Cómo funciona el Ranking?</h2>
            <p className="text-lg text-gray-600">Sistema transparente y justo para clasificar equipos de Ultimate</p>
          </div>

          {/* Step 1: Tournament Participation */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-8 mb-6">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Animation */}
              <div className="flex-shrink-0 order-1 lg:order-1">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Tournament bracket/field */}
                    <rect x="15" y="75" width="170" height="50" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="3" rx="6"/>
                    <text x="100" y="105" textAnchor="middle" fontSize="14" fill="#374151" fontWeight="bold">TORNEO</text>
                    
                    {/* Teams entering tournament */}
                    <g>
                      {/* Team 1 */}
                      <circle cx="40" cy="35" r="8" fill="#3b82f6" stroke="#1e40af" strokeWidth="2">
                        <animate attributeName="cy" values="35;100" dur="2s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="1;0.8;1" dur="2s" repeatCount="indefinite"/>
                      </circle>
                      <text x="40" y="20" textAnchor="middle" fontSize="10" fill="#1e40af" fontWeight="bold">Equipo A</text>
                      
                      {/* Team 2 */}
                      <circle cx="70" cy="35" r="8" fill="#1d4ed8" stroke="#1e40af" strokeWidth="2">
                        <animate attributeName="cy" values="35;100" dur="2s" begin="0.3s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="1;0.8;1" dur="2s" begin="0.3s" repeatCount="indefinite"/>
                      </circle>
                      <text x="70" y="20" textAnchor="middle" fontSize="10" fill="#1e40af" fontWeight="bold">Equipo B</text>
                      
                      {/* Team 3 */}
                      <circle cx="130" cy="35" r="8" fill="#2563eb" stroke="#1e40af" strokeWidth="2">
                        <animate attributeName="cy" values="35;100" dur="2s" begin="0.6s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="1;0.8;1" dur="2s" begin="0.6s" repeatCount="indefinite"/>
                      </circle>
                      <text x="130" y="20" textAnchor="middle" fontSize="10" fill="#1e40af" fontWeight="bold">Equipo C</text>
                      
                      {/* Team 4 */}
                      <circle cx="160" cy="35" r="8" fill="#1e40af" stroke="#1e40af" strokeWidth="2">
                        <animate attributeName="cy" values="35;100" dur="2s" begin="0.9s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="1;0.8;1" dur="2s" begin="0.9s" repeatCount="indefinite"/>
                      </circle>
                      <text x="160" y="20" textAnchor="middle" fontSize="10" fill="#1e40af" fontWeight="bold">Equipo D</text>
                    </g>
                    
                    {/* Competition arrows */}
                    <g>
                      <path d="M 50 100 L 50 120" stroke="#6b7280" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)">
                        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1.5s" repeatCount="indefinite"/>
                      </path>
                      <path d="M 150 100 L 150 120" stroke="#6b7280" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)">
                        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1.8s" repeatCount="indefinite"/>
                      </path>
                    </g>
                    
                    {/* Results podium */}
                    <g>
                      {/* 1st place */}
                      <rect x="75" y="125" width="25" height="25" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" rx="3"/>
                      <text x="87.5" y="142" textAnchor="middle" fontSize="10" fill="#92400e" fontWeight="bold">1º</text>
                      <text x="87.5" y="155" textAnchor="middle" fontSize="8" fill="#10b981" fontWeight="bold">1000 pts</text>
                      
                      {/* 2nd place */}
                      <rect x="105" y="130" width="25" height="20" fill="#c0c0c0" stroke="#9ca3af" strokeWidth="2" rx="3"/>
                      <text x="117.5" y="145" textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="bold">2º</text>
                      <text x="117.5" y="155" textAnchor="middle" fontSize="8" fill="#10b981" fontWeight="bold">800 pts</text>
                      
                      {/* 3rd place */}
                      <rect x="135" y="135" width="25" height="15" fill="#cd7f32" stroke="#a78bfa" strokeWidth="2" rx="3"/>
                      <text x="147.5" y="148" textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="bold">3º</text>
                      <text x="147.5" y="155" textAnchor="middle" fontSize="8" fill="#10b981" fontWeight="bold">600 pts</text>
                    </g>
                    
                    {/* Points flowing to teams */}
                    <g>
                      <text x="55" y="115" fontSize="10" fill="#10b981" fontWeight="bold" opacity="0.9">
                        <animate attributeName="y" values="115;95;115" dur="3s" begin="2s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.9;1;0.9" dur="3s" begin="2s" repeatCount="indefinite"/>
                        +1000
                      </text>
                      <text x="145" y="115" fontSize="10" fill="#059669" fontWeight="bold" opacity="0.8">
                        <animate attributeName="y" values="115;95;115" dur="3s" begin="2.3s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" begin="2.3s" repeatCount="indefinite"/>
                        +800
                      </text>
                    </g>
                    
                    {/* Arrow marker definition */}
                    <defs>
                      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280"/>
                      </marker>
                    </defs>
                  </svg>
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-3">
                  <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full mr-3">PASO 1</span>
                  <h3 className="text-2xl font-bold text-gray-900">Participación en Torneos</h3>
                </div>
                <p className="text-lg text-gray-700 mb-6">
                  Los equipos compiten en <strong>Campeonatos de España</strong> (1ª y 2ª División) y <strong>Campeonatos Regionales</strong> (CR1, CR2, CR3), obteniendo puntos según su posición final en cada competición. Cada combinación de modalidad y superficie tiene su propio ranking independiente.
                </p>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-4">Rankings por Modalidad</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h5 className="font-semibold text-gray-900 mb-3 text-blue-700">Playa</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="font-medium text-gray-900">Mixto</span>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="font-medium text-gray-900">Open</span>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="font-medium text-gray-900">Women</span>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <h5 className="font-semibold text-gray-900 mb-3 text-green-700">Césped</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="font-medium text-gray-900">Mixto</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="font-medium text-gray-900">Open</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="font-medium text-gray-900">Women</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Points Calculation */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-8 mb-6">
            <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <Target className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-3">
                  <span className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full mr-3">PASO 2</span>
                  <h3 className="text-2xl font-bold text-gray-900">Cálculo de Puntos</h3>
                </div>
                <p className="text-lg text-gray-700 mb-4">
                  Los puntos se calculan aplicando tres factores: puntos base por posición, coeficiente regional y peso por antigüedad de temporada.
                </p>
                
                <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Tabla de Puntos por Posición</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2 text-center">🏆 1ª División</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between p-2 bg-yellow-50 rounded">
                          <span>1º lugar</span>
                          <span className="font-mono font-semibold">1000 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>2º lugar</span>
                          <span className="font-mono font-semibold">800 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-orange-50 rounded">
                          <span>3º lugar</span>
                          <span className="font-mono font-semibold">600 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>4º lugar</span>
                          <span className="font-mono font-semibold">400 pts</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2 text-center">🥈 2ª División</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between p-2 bg-yellow-50 rounded">
                          <span>1º lugar</span>
                          <span className="font-mono font-semibold">500 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>2º lugar</span>
                          <span className="font-mono font-semibold">400 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-orange-50 rounded">
                          <span>3º lugar</span>
                          <span className="font-mono font-semibold">300 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>4º lugar</span>
                          <span className="font-mono font-semibold">200 pts</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2 text-center">🏅 Regionales</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between p-2 bg-yellow-50 rounded">
                          <span>1º lugar</span>
                          <span className="font-mono font-semibold">300 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>2º lugar</span>
                          <span className="font-mono font-semibold">250 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-orange-50 rounded">
                          <span>3º lugar</span>
                          <span className="font-mono font-semibold">200 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>4º lugar</span>
                          <span className="font-mono font-semibold">150 pts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600">
                    <strong>Fórmula:</strong> <span className="font-mono bg-green-100 px-2 py-1 rounded">Puntos Base × Coeficiente Regional × Peso Temporal</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Time Weighting */}
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg shadow-sm border border-yellow-200 p-8 mb-6">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <Clock className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-3">
                  <span className="bg-yellow-500 text-white text-sm font-bold px-3 py-1 rounded-full mr-3">PASO 3</span>
                  <h3 className="text-2xl font-bold text-gray-900">Peso Temporal</h3>
                </div>
                <p className="text-lg text-gray-700 mb-4">
                  Los puntos se ponderan según la antigüedad de la temporada, dando más importancia a los resultados más recientes.
                </p>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-gray-900">Temporada Actual</div>
                      <div className="text-yellow-600 font-semibold">100%</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">1 año atrás</div>
                      <div className="text-yellow-600 font-semibold">80%</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">2 años atrás</div>
                      <div className="text-yellow-600 font-semibold">50%</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">3 años atrás</div>
                      <div className="text-yellow-600 font-semibold">20%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Final Ranking */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-8 mb-6">
            <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <Award className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-3">
                  <span className="bg-purple-500 text-white text-sm font-bold px-3 py-1 rounded-full mr-3">PASO 4</span>
                  <h3 className="text-2xl font-bold text-gray-900">Clasificación Final</h3>
                </div>
                <p className="text-lg text-gray-700 mb-4">
                  Se suman todos los puntos ponderados de todas las temporadas y modalidades para obtener la posición final en el ranking.
                </p>
                
                <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Rankings Combinados</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Además de los rankings específicos por modalidad, existen rankings combinados que suman puntos de múltiples categorías:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <div className="font-medium text-gray-900">🏖️ Ranking Playa</div>
                        <div className="text-sm text-gray-600">Suma: Mixto + Open + Women (Playa)</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div className="font-medium text-gray-900">🌱 Ranking Césped</div>
                        <div className="text-sm text-gray-600">Suma: Mixto + Open + Women (Césped)</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                        <div className="font-medium text-gray-900">👥 Ranking Mixto</div>
                        <div className="text-sm text-gray-600">Suma: Playa Mixto + Césped Mixto</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                        <div className="font-medium text-gray-900">⚡ Ranking Open</div>
                        <div className="text-sm text-gray-600">Suma: Playa Open + Césped Open</div>
                      </div>
                      <div className="p-3 bg-pink-50 rounded-lg border-l-4 border-pink-500">
                        <div className="font-medium text-gray-900">👩 Ranking Women</div>
                        <div className="text-sm text-gray-600">Suma: Playa Women + Césped Women</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-gray-500">
                        <div className="font-medium text-gray-900">🌍 Ranking Global</div>
                        <div className="text-sm text-gray-600">Suma: Todas las modalidades</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600">
                    <strong>Resultado:</strong> Ranking ordenado de mayor a menor puntuación total, actualizado automáticamente tras cada torneo.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Formula Section */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Fórmula Completa del Ranking</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Modalidades Incluidas</h4>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                    <div>
                      <div className="font-medium text-gray-900">🏖️ Playa</div>
                      <div className="text-sm text-gray-600">Mixto, Open, Women</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <div className="font-medium text-gray-900">🌱 Césped</div>
                      <div className="text-sm text-gray-600">Mixto, Open, Women</div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Coeficientes Regionales</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="font-medium text-gray-900">Madrid</span>
                    </div>
                    <span className="font-mono bg-yellow-100 px-2 py-1 rounded text-sm">1.2x</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <Zap className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="font-medium text-gray-900">Cataluña</span>
                    </div>
                    <span className="font-mono bg-orange-100 px-2 py-1 rounded text-sm">1.1x</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <Zap className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="font-medium text-gray-900">Otras Regiones</span>
                    </div>
                    <span className="font-mono bg-blue-100 px-2 py-1 rounded text-sm">1.0x</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border-2 border-blue-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 text-center">Ejemplo Práctico</h4>
              <p className="text-gray-700 text-center">
                Un equipo que queda <strong>3º lugar</strong> en un torneo de <strong>Madrid</strong> en la temporada <strong>2024-25</strong> obtiene:
              </p>
              <div className="mt-4 text-center">
                <span className="font-mono text-lg bg-blue-100 px-4 py-2 rounded-lg">
                  (300 puntos × 1.2 regional × 1.0 temporal) = <strong className="text-blue-600">360 puntos</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ranking Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-12">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Ranking Actual</h2>
              <Link
                to="/ranking"
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
              >
                Ver completo
                <Eye className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar equipos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">Todas las regiones</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.code}>
                      {region.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">Todos los años</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ranking Table */}
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
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeams.slice(0, 10).map((team) => (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{team.currentRank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/teams/${team.id}`}
                        className="flex items-center text-sm font-medium text-gray-900 hover:text-primary-600"
                      >
                        <TeamLogo 
                          name={team.name} 
                          logo={team.logo} 
                          size="sm"
                        />
                        <div className="ml-3">
                          <div>{team.name}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {team.region || 'Sin región'}
                      </div>
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
                      <Link
                        to={`/teams/${team.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Ver detalles
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts and Recent Tournaments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Ranking Evolution Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Evolución del Ranking</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rankingHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="totalTeams" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Número total de equipos activos
            </p>
          </div>

          {/* Recent Tournaments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Torneos Recientes</h3>
            <div className="space-y-4">
              {recentTournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  to={`/tournaments/${tournament.id}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                      <Trophy className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{tournament.name}</h4>
                      <p className="text-sm text-gray-500">
                        {getTournamentTypeLabel(tournament.type)} • {tournament.teams} equipos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tournament.status)}`}>
                      {getStatusLabel(tournament.status)}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{tournament.startDate}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link
                to="/tournaments"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Ver todos los torneos
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/teams"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Equipos</h3>
                <p className="text-gray-600">Explora todos los equipos participantes</p>
              </div>
            </div>
          </Link>
          <Link
            to="/tournaments"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Torneos</h3>
                <p className="text-gray-600">Consulta resultados y calendario</p>
              </div>
            </div>
          </Link>
          <Link
            to="/regions"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Regiones</h3>
                <p className="text-gray-600">Descubre las regiones participantes</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
        </>
      )}
    </div>
  )
}

export default HomePage
