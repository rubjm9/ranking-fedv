import React from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, Upload, BarChart3 } from 'lucide-react'

const quickActions = [
  {
    name: 'Nuevo equipo',
    description: 'Registrar un nuevo equipo',
    icon: Plus,
    href: '/admin/teams/new',
    iconClass: 'bg-brand-subtle text-link',
  },
  {
    name: 'Nuevo campeonato',
    description: 'Crear un nuevo campeonato',
    icon: Calendar,
    href: '/admin/tournaments/new',
    iconClass: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300',
  },
  {
    name: 'Importar resultados',
    description: 'Subir resultados desde CSV/Excel',
    icon: Upload,
    href: '/admin/import-export',
    iconClass: 'bg-accent-100 dark:bg-accent-950/50 text-accent-700 dark:text-accent-300',
  },
  {
    name: 'Configuración',
    description: 'Ajustar parámetros del sistema',
    icon: BarChart3,
    href: '/admin/configuration',
    iconClass: 'bg-surface-muted text-content-muted',
  },
]

const DashboardQuickActions: React.FC = () => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-content mb-4">Acciones rápidas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.name}
              to={action.href}
              className="card border border-line hover:border-brand-strong/30 hover:bg-brand-subtle/50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <div className="flex items-center p-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${action.iconClass}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-content">{action.name}</h3>
                  <p className="text-sm text-content-muted">{action.description}</p>
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
