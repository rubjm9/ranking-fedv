import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Upload, 
  RefreshCw,
  Activity,
  Award,
  Target,
  BarChart3
} from 'lucide-react'

const DashboardPage: React.FC = () => {
  // Mock data - en producción vendría de la API
  const stats = [
    { 
      name: 'Equipos registrados', 
      value: '156', 
      change: '+12', 
      changeType: 'positive',
      icon: Users,
      href: '/admin/teams'
    },
    { 
      name: 'Regiones activas', 
      value: '17', 
      change: '0', 
      changeType: 'neutral',
      icon: MapPin,
      href: '/admin/regions'
    },
    { 
      name: 'Torneos este año', 
      value: '23', 
      change: '+5', 
      changeType: 'positive',
      icon: Calendar,
      href: '/admin/tournaments'
    },
    { 
      name: 'Ranking actualizado', 
      value: 'Hace 2h', 
      change: '', 
      changeType: 'neutral',
      icon: TrendingUp,
      href: '/admin/ranking'
    }
  ]

  const quickActions = [
    {
      name: 'Nuevo equipo',
      description: 'Registrar un nuevo equipo',
      icon: Plus,
      href: '/admin/teams/new',
      color: 'bg-blue-500'
    },
    {
      name: 'Nuevo torneo',
      description: 'Crear un nuevo torneo',
      icon: Calendar,
      href: '/admin/tournaments/new',
      color: 'bg-green-500'
    },
    {
      name: 'Importar resultados',
      description: 'Subir resultados desde CSV/Excel',
      icon: Upload,
      href: '/admin/import-export',
      color: 'bg-purple-500'
    },
    {
      name: 'Recalcular ranking',
      description: 'Actualizar puntuaciones',
      icon: RefreshCw,
      href: '/admin/ranking',
      color: 'bg-red-500'
    },
    {
      name: 'Configuración',
      description: 'Ajustar parámetros del sistema',
      icon: BarChart3,
      href: '/admin/configuration',
      color: 'bg-gray-500'
    }
  ]

  const recentActivity = [
    {
      action: 'Nuevo equipo registrado',
      details: 'Madrid Ultimate Club',
      time: 'Hace 30 minutos',
      type: 'team'
    },
    {
      action: 'Resultados importados',
      details: 'Torneo Regional Madrid 2024',
      time: 'Hace 2 horas',
      type: 'tournament'
    },
    {
      action: 'Ranking recalculado',
      details: 'Actualización automática',
      time: 'Hace 3 horas',
      type: 'ranking'
    },
    {
      action: 'Nuevo torneo creado',
      details: 'CE2 Valencia 2024',
      time: 'Hace 1 día',
      type: 'tournament'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'team':
        return <Users className="h-4 w-4" />
      case 'tournament':
        return <Calendar className="h-4 w-4" />
      case 'ranking':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Bienvenido al panel de administración FEDV</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/ranking"
            className="btn-primary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recalcular Ranking
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link
              key={index}
              to={stat.href}
              className="card-hover"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  {stat.change && (
                    <p className={`text-sm ${
                      stat.changeType === 'positive' ? 'text-green-600' : 
                      stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {stat.change} desde el mes pasado
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Link
                  key={index}
                  to={action.href}
                  className="card-hover group"
                >
                  <div className="flex items-center p-4">
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{action.name}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad reciente</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.details}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del sistema</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Base de datos</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Conectado
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Backend</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operativo
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Última actualización</span>
              <span className="text-sm text-gray-900">Hace 2 horas</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Próxima actualización</span>
              <span className="text-sm text-gray-900">En 22 horas</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximas acciones</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Revisar equipos inactivos</p>
                <p className="text-xs text-gray-600">15 equipos sin actividad reciente</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Award className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Actualizar coeficientes regionales</p>
                <p className="text-xs text-gray-600">3 regiones requieren ajuste</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Programar torneos 2025</p>
                <p className="text-xs text-gray-600">Calendario pendiente de revisión</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
