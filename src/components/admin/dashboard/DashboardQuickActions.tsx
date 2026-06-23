import React from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, Upload, BarChart3 } from 'lucide-react'

const quickActions = [
  {
    name: 'Nuevo equipo',
    description: 'Registrar un nuevo equipo',
    icon: Plus,
    href: '/admin/teams/new',
    iconClass: 'bg-primary-100 text-primary-600',
  },
  {
    name: 'Nuevo torneo',
    description: 'Crear un nuevo torneo',
    icon: Calendar,
    href: '/admin/tournaments/new',
    iconClass: 'bg-emerald-100 text-emerald-600',
  },
  {
    name: 'Importar resultados',
    description: 'Subir resultados desde CSV/Excel',
    icon: Upload,
    href: '/admin/import-export',
    iconClass: 'bg-accent-100 text-accent-700',
  },
  {
    name: 'Configuración',
    description: 'Ajustar parámetros del sistema',
    icon: BarChart3,
    href: '/admin/configuration',
    iconClass: 'bg-secondary-100 text-secondary-600',
  },
]

const DashboardQuickActions: React.FC = () => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-secondary-900 mb-4">Acciones rápidas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.name}
              to={action.href}
              className="card border border-secondary-200 hover:border-primary-200 hover:bg-primary-50/50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <div className="flex items-center p-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${action.iconClass}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-secondary-900">{action.name}</h3>
                  <p className="text-sm text-secondary-600">{action.description}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default DashboardQuickActions
