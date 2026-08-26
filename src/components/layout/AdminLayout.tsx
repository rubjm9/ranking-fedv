import React, { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/SimpleAuthContext'
import { 
  BarChart3, 
  UsersRound, 
  MapPin, 
  Calendar, 
  Settings, 
  Upload, 
  LogOut, 
  Menu, 
  X,
  Home,
  TrendingUp,
  Shield,
  Clock,
  History,
  UserCog
} from 'lucide-react'
import toast from 'react-hot-toast'
import AdminNotificationBanner, { NotificationBadge } from '@/components/admin/AdminNotificationBanner'
import { useInertBackground } from '@/hooks/useInertBackground'

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, isAdmin, role } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const sidebarToggleRef = useRef<HTMLButtonElement>(null)

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
    { name: 'Equipos', href: '/admin/teams', icon: UsersRound },
    { name: 'Regiones', href: '/admin/regions', icon: MapPin },
    { name: 'Campeonatos', href: '/admin/tournaments', icon: Calendar },
    { name: 'Histórico', href: '/admin/historico', icon: History },
    { name: 'Ranking', href: '/admin/ranking', icon: TrendingUp },
    { name: 'Temporadas y ranking', href: '/admin/seasons', icon: Clock },
    { name: 'Importar/Exportar', href: '/admin/import-export', icon: Upload },
    { name: 'Configuración', href: '/admin/configuration', icon: Settings },
    ...(isAdmin
      ? [{ name: 'Usuarios', href: '/admin/users', icon: UserCog }]
      : []),
  ]

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Sesión cerrada correctamente')
      navigate('/')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      toast.error('Error al cerrar sesión')
    }
  }

  const isActive = (href: string) => {
    return location.pathname === href
  }

  const getCurrentSection = () => {
    const pathname = location.pathname
    if (pathname === '/admin' || pathname === '/admin/') {
      return 'Dashboard'
    }
    const match = navigation.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    )
    return match?.name ?? null
  }

  const currentSection = getCurrentSection()
  // El drawer móvil también debe aislar el contenido de detrás.
  useInertBackground(sidebarOpen)

  // Drawer móvil: bloquea el scroll del fondo y permite cerrar con Escape.
  useEffect(() => {
    if (!sidebarOpen) return

    const { body } = document
    const previousOverflow = body.style.overflow
    body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false)
        sidebarToggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [sidebarOpen])

  // Cierra el drawer al navegar a otra sección.
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-surface-muted flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      {/*
        Layout en columna: sin él, el bloque de usuario iba en `absolute bottom-0`
        y tapaba los últimos enlaces en pantallas cortas, sin scroll para alcanzarlos.
      */}
      <div className={`
        fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-surface shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:relative
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-shrink-0 items-center justify-between h-16 px-6 border-b border-line">
          <Link
            to="/admin/dashboard"
            className="flex items-center min-w-0"
            onClick={() => setSidebarOpen(false)}
          >
            <Shield className="h-8 w-8 text-link mr-3 flex-shrink-0" />
            <span className="font-display text-xl font-bold text-content truncate">
              FEDV Admin
            </span>
          </Link>
          
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
            className="lg:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation rounded-md text-content-muted hover:text-content hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                    ${isActive(item.href)
                      ? 'bg-brand-subtle text-brand-strong border-r-2 border-primary-600'
                      : 'text-content-muted hover:bg-surface-muted hover:text-content'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User info and logout */}
        <div className="flex-shrink-0 p-4 border-t border-line">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-brand-subtle rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-brand-strong">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-content">
                  {role === 'admin' ? 'Admin' : 'Editor'}
                </p>
                <p className="text-xs text-content-subtle truncate">{user?.email}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation text-content-muted hover:text-content hover:bg-surface-muted rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1 lg:ml-0">
        {/* Top header */}
        <div className="sticky top-0 z-10 bg-surface shadow-sm border-b border-line">
          <div className="flex h-16 items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center">
              <button
                ref={sidebarToggleRef}
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú"
                aria-expanded={sidebarOpen}
                className="lg:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation rounded-md text-content-muted hover:text-content hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              {currentSection && (
                <p className="ml-2 truncate font-display text-base font-semibold text-content-muted sm:ml-4 sm:text-lg lg:ml-0">
                  {currentSection}
                </p>
              )}
            </div>

            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
              {/* Badge de notificaciones */}
              <NotificationBadge />

              <Link
                to="/"
                className="inline-flex min-h-[44px] shrink-0 items-center gap-1 touch-manipulation rounded-lg px-1 text-sm text-content-muted transition-colors duration-200 hover:text-content focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sitio público</span>
                <span className="sr-only sm:hidden">Ir al sitio público</span>
              </Link>

              <div className="hidden sm:block w-px h-6 bg-line-strong" aria-hidden="true"></div>

              {/* El email se trunca: completo desbordaba la cabecera en móvil. */}
              <div className="hidden min-w-0 items-center text-sm text-content-muted sm:flex">
                <span className="shrink-0">Bienvenido,</span>
                <span className="ml-1 truncate font-medium text-content">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Banner de notificaciones de administración */}
              <AdminNotificationBanner className="mb-6" />
              
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
