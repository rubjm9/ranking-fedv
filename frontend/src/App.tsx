import { Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import PublicLayout from '@/components/layout/PublicLayout'
import AdminLayout from '@/components/layout/AdminLayout'

// Páginas públicas
import HomePage from '@/pages/HomePage'
import RankingPage from '@/pages/RankingPage'
import TeamsPage from '@/pages/TeamsPage'
import TeamPage from '@/pages/TeamPage'
import RegionsPage from '@/pages/RegionsPage'
import RegionPage from '@/pages/RegionPage'
import TournamentsPage from '@/pages/TournamentsPage'
import TournamentPage from '@/pages/TournamentPage'
import AboutPage from '@/pages/AboutPage'

// Páginas de autenticación
import LoginPage from '@/pages/LoginPage'

// Páginas de administración
import DashboardPage from '@/pages/DashboardPage'
import TeamsAdminPage from '@/pages/TeamsAdminPage'
import RegionsAdminPage from '@/pages/RegionsAdminPage'
import TournamentsAdminPage from '@/pages/TournamentsAdminPage'
import ConfigurationPage from '@/pages/admin/ConfigurationPage'
import ImportExportPage from '@/pages/admin/ImportExportPage'
import NewTeamPage from '@/pages/admin/NewTeamPage'
import NewTournamentPage from '@/pages/admin/NewTournamentPage'
import NewRegionPage from '@/pages/admin/NewRegionPage'
import NewResultPage from '@/pages/admin/NewResultPage'
import EditTeamPage from '@/pages/admin/EditTeamPage'
import EditTournamentPage from '@/pages/admin/EditTournamentPage'
import EditRegionPage from '@/pages/admin/EditRegionPage'
import RegionDetailAdminPage from '@/pages/admin/RegionDetailAdminPage'
import RankingAdminPage from '@/pages/admin/RankingAdminPage'
import TeamDetailPage from '@/pages/TeamDetailPage'
import TournamentDetailPage from '@/pages/TournamentDetailPage'
import RegionDetailPage from '@/pages/RegionDetailPage'

// Componentes
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

// Configurar React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="ranking" element={<RankingPage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="teams/:id" element={<TeamDetailPage />} />
              <Route path="regions" element={<RegionsPage />} />
              <Route path="regions/:id" element={<RegionDetailPage />} />
              <Route path="tournaments" element={<TournamentsPage />} />
              <Route path="tournaments/:id" element={<TournamentDetailPage />} />
              <Route path="about" element={<AboutPage />} />
            </Route>

            {/* Rutas de autenticación */}
            <Route path="/auth" element={<PublicLayout />}>
              <Route path="login" element={<LoginPage />} />
            </Route>

            {/* Rutas de administración */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="teams" element={<TeamsAdminPage />} />
              <Route path="teams/new" element={<NewTeamPage />} />
              <Route path="teams/:id/edit" element={<EditTeamPage />} />
                          <Route path="regions" element={<RegionsAdminPage />} />
            <Route path="regions/new" element={<NewRegionPage />} />
            <Route path="regions/:id" element={<RegionDetailAdminPage />} />
            <Route path="regions/:id/edit" element={<EditRegionPage />} />
              <Route path="tournaments" element={<TournamentsAdminPage />} />
              <Route path="tournaments/new" element={<NewTournamentPage />} />
              <Route path="tournaments/:id/edit" element={<EditTournamentPage />} />
              <Route path="tournaments/:tournamentId/results/new" element={<NewResultPage />} />
              <Route path="ranking" element={<RankingAdminPage />} />
              <Route path="configuration" element={<ConfigurationPage />} />
              <Route path="import-export" element={<ImportExportPage />} />
            </Route>

            {/* Ruta 404 */}
            <Route path="*" element={
              <PublicLayout>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                    <h2 className="text-2xl font-semibold text-gray-600 mb-4">
                      Página no encontrada
                    </h2>
                    <p className="text-gray-500 mb-8">
                      La página que buscas no existe o ha sido movida.
                    </p>
                    <a
                      href="/"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Volver al inicio
                    </a>
                  </div>
                </div>
              </PublicLayout>
            } />
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}

export default App
