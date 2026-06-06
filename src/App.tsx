import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/SimpleAuthContext'
import PublicLayout from '@/components/layout/PublicLayout'
import AdminLayout from '@/components/layout/AdminLayout'

// Páginas públicas
import HomePage from '@/pages/HomePage'
import RankingPageNew from '@/pages/RankingPageNew'
import RankingPageHybrid from '@/pages/RankingPageHybrid'
import TeamsPage from '@/pages/TeamsPage'
import RegionsPage from '@/pages/RegionsPage'
import TournamentsPage from '@/pages/TournamentsPage'
import AboutPage from '@/pages/AboutPage'
import NotFoundPage from '@/pages/NotFoundPage'
import PrivacyPage from '@/pages/PrivacyPage'
import TermsPage from '@/pages/TermsPage'

// Páginas de autenticación
import LoginPage from '@/pages/LoginPage'

// Páginas de administración
import DashboardPage from '@/pages/DashboardPage'
import TeamsAdminPage from '@/pages/TeamsAdminPage'
import RegionsAdminPage from '@/pages/RegionsAdminPage'
import TournamentsAdminPage from '@/pages/TournamentsAdminPage'
import ConfigurationPage from '@/pages/admin/ConfigurationPage'
import ImportExportPage from '@/pages/admin/ImportExportPage'
import SeasonManagementPage from '@/pages/admin/SeasonManagementPage'
import RankingComparisonPage from '@/pages/admin/RankingComparisonPage'
import DatabaseDiagnosticPage from '@/pages/admin/DatabaseDiagnosticPage'
import RankingAdminPageHybrid from '@/pages/admin/RankingAdminPageHybrid'
import RankingUpdatePage from '@/pages/admin/RankingUpdatePage'
import SimulateRankingsPage from '@/pages/admin/SimulateRankingsPage'
import MigrateRankingsPage from '@/pages/admin/MigrateRankingsPage'
import NewTeamPage from '@/pages/admin/NewTeamPage'
import NewTournamentPage from '@/pages/admin/NewTournamentPage'
import NewRegionPage from '@/pages/admin/NewRegionPage'
import NewResultPage from '@/pages/admin/NewResultPage'
import EditResultPage from '@/pages/admin/EditResultPage'
import TournamentDetailAdminPage from '@/pages/admin/TournamentDetailAdminPage'
import ImportResultsPage from '@/pages/admin/ImportResultsPage'
import EditTeamPage from '@/pages/admin/EditTeamPage'
import EditTournamentPage from '@/pages/admin/EditTournamentPage'
import EditRegionPage from '@/pages/admin/EditRegionPage'
import RegionDetailAdminPage from '@/pages/admin/RegionDetailAdminPage'
import HistoricoPage from '@/pages/admin/HistoricoPage'
import SubseasonsManagementPage from '@/pages/admin/SubseasonsManagementPage'
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
      gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
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
              <Route path="ranking">
                <Route index element={<Navigate to="/ranking/general" replace />} />
                <Route path=":surface" element={<RankingPageNew />} />
              </Route>
              <Route path="ranking-old" element={<RankingPageHybrid />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="teams/:id" element={<TeamDetailPage />} />
              <Route path="regions" element={<RegionsPage />} />
              <Route path="regions/:id" element={<RegionDetailPage />} />
              <Route path="tournaments" element={<TournamentsPage />} />
              <Route path="tournaments/:id" element={<TournamentDetailPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="terms" element={<TermsPage />} />
              <Route path="*" element={<NotFoundPage />} />
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
              <Route path="historico" element={<HistoricoPage />} />
              <Route path="tournaments" element={<TournamentsAdminPage />} />
              <Route path="tournaments/new" element={<NewTournamentPage />} />
              <Route path="tournaments/:id" element={<TournamentDetailAdminPage />} />
              <Route path="tournaments/:id/edit" element={<EditTournamentPage />} />
              <Route path="tournaments/:tournamentId/results/new" element={<NewResultPage />} />
              <Route path="tournaments/:tournamentId/results/import" element={<ImportResultsPage />} />
              <Route path="results/:id/edit" element={<EditResultPage />} />
              <Route path="ranking" element={<RankingAdminPageHybrid />} />
                  <Route path="ranking-update" element={<RankingUpdatePage />} />
                  <Route path="simulate-rankings" element={<SimulateRankingsPage />} />
                  <Route path="migrate-rankings" element={<MigrateRankingsPage />} />
                  <Route path="configuration" element={<ConfigurationPage />} />
              <Route path="import-export" element={<ImportExportPage />} />
              <Route path="seasons" element={<SeasonManagementPage />} />
              <Route path="subseasons" element={<SubseasonsManagementPage />} />
              <Route path="ranking-comparison" element={<RankingComparisonPage />} />
              <Route path="database-diagnostic" element={<DatabaseDiagnosticPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}

export default App
