import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/SimpleAuthContext'
import PublicLayout from '@/components/layout/PublicLayout'
import AdminLayout from '@/components/layout/AdminLayout'

// Páginas públicas
import HomePage from '@/pages/HomePage'
import RankingPageNew from '@/pages/RankingPageNew'
import NotFoundPageSync from '@/pages/NotFoundPage'
import { SURFACES, type SurfaceSlug } from '@/constants/surfaces'
import TeamsPage from '@/pages/TeamsPage'
import RegionsPage from '@/pages/RegionsPage'
import TournamentsPage from '@/pages/TournamentsPage'

// Páginas de autenticación

// Páginas de administración
import TeamLegacyRedirect from '@/pages/TeamLegacyRedirect'
import RegionLegacyRedirect from '@/pages/RegionLegacyRedirect'

/** Redirect cliente de `/tournaments/:id` → `/campeonatos/:id` (misma id, sin lookup). */
function TournamentLegacyRedirect() {
  const { id } = useParams()
  return <Navigate to={`/campeonatos/${id}`} replace />
}

/** Valida :surface antes de montar el ranking (evita soft-404 en slugs inventados). */
function RankingSurfaceGate() {
  const { surface } = useParams<{ surface: string }>()
  if (!surface || !SURFACES.includes(surface as SurfaceSlug)) {
    return <NotFoundPageSync />
  }
  return <RankingPageNew />
}

/*
 * Carga bajo demanda. El panel completo (con exceljs y @dnd-kit) y las páginas
 * de detalle salían en el chunk inicial, así que cualquier visita anónima
 * descargaba el editor de torneos para ver una clasificación.
 */
const TeamDetailPage = lazy(() => import('@/pages/TeamDetailPage'))
const RegionDetailPage = lazy(() => import('@/pages/RegionDetailPage'))
const TournamentDetailPage = lazy(() => import('@/pages/TournamentDetailPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const GlosarioPage = lazy(() => import('@/pages/GlosarioPage'))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))
const DiscGolfPage = lazy(() => import('@/pages/DiscGolfPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const TeamsAdminPage = lazy(() => import('@/pages/TeamsAdminPage'))
const RegionsAdminPage = lazy(() => import('@/pages/RegionsAdminPage'))
const TournamentsAdminPage = lazy(() => import('@/pages/TournamentsAdminPage'))
const ConfigurationPage = lazy(() => import('@/pages/admin/ConfigurationPage'))
const ImportExportPage = lazy(() => import('@/pages/admin/ImportExportPage'))
const SeasonManagementPage = lazy(() => import('@/pages/admin/SeasonManagementPage'))
const RankingAdminPageHybrid = lazy(() => import('@/pages/admin/RankingAdminPageHybrid'))
const NewTeamPage = lazy(() => import('@/pages/admin/NewTeamPage'))
const NewTournamentPage = lazy(() => import('@/pages/admin/NewTournamentPage'))
const NewRegionPage = lazy(() => import('@/pages/admin/NewRegionPage'))
const NewResultPage = lazy(() => import('@/pages/admin/NewResultPage'))
const EditResultPage = lazy(() => import('@/pages/admin/EditResultPage'))
const TournamentDetailAdminPage = lazy(() => import('@/pages/admin/TournamentDetailAdminPage'))
const ImportResultsPage = lazy(() => import('@/pages/admin/ImportResultsPage'))
const EditTeamPage = lazy(() => import('@/pages/admin/EditTeamPage'))
const EditTournamentPage = lazy(() => import('@/pages/admin/EditTournamentPage'))
const EditRegionPage = lazy(() => import('@/pages/admin/EditRegionPage'))
const RegionDetailAdminPage = lazy(() => import('@/pages/admin/RegionDetailAdminPage'))
const HistoricoPage = lazy(() => import('@/pages/admin/HistoricoPage'))
const UsersAdminPage = lazy(() => import('@/pages/admin/UsersAdminPage'))

// Componentes
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AdminOnlyRoute from '@/components/auth/AdminOnlyRoute'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import AnalyticsRoot from '@/components/layout/AnalyticsRoot'
import CanonicalSync from '@/components/layout/CanonicalSync'
import HideSeoStaticOnHydrate from '@/components/seo/HideSeoStaticOnHydrate'

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


/** Reserva alto mientras llega el chunk de la ruta, para no colapsar el layout. */
const CargandoRuta = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Cargando página"
    className="flex min-h-[60vh] items-center justify-center"
  >
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary-600" />
  </div>
)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <AnalyticsRoot />
          <CanonicalSync />
          <HideSeoStaticOnHydrate />
          <Suspense fallback={<CargandoRuta />}>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="ranking">
                <Route index element={<Navigate to="/ranking/resumen" replace />} />
                <Route path=":surface" element={<RankingSurfaceGate />} />
              </Route>
              <Route path="ranking-old" element={<Navigate to="/ranking" replace />} />
              <Route path="equipos" element={<TeamsPage />} />
              <Route path="equipos/:slug" element={<TeamDetailPage />} />
              <Route path="teams" element={<Navigate to="/equipos" replace />} />
              <Route path="teams/:id" element={<TeamLegacyRedirect />} />
              <Route path="regiones" element={<RegionsPage />} />
              <Route path="regiones/:slug" element={<RegionDetailPage />} />
              <Route path="regions" element={<Navigate to="/regiones" replace />} />
              <Route path="regions/:id" element={<RegionLegacyRedirect />} />
              <Route path="campeonatos" element={<TournamentsPage />} />
              <Route path="campeonatos/:id" element={<TournamentDetailPage />} />
              <Route path="tournaments" element={<Navigate to="/campeonatos" replace />} />
              <Route path="tournaments/:id" element={<TournamentLegacyRedirect />} />
              <Route path="como-funciona" element={<AboutPage />} />
              <Route path="glosario" element={<GlosarioPage />} />
              <Route path="about" element={<Navigate to="/como-funciona" replace />} />
              <Route path="disc-golf" element={<DiscGolfPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="terms" element={<TermsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Rutas de autenticación */}
            <Route path="/login" element={<PublicLayout />}>
              <Route index element={<LoginPage />} />
            </Route>
            <Route path="/auth/login" element={<Navigate to="/login" replace />} />

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
              <Route path="ranking-update" element={<Navigate to="/admin/seasons" replace />} />
                  <Route path="configuration" element={<ConfigurationPage />} />
              <Route path="import-export" element={<ImportExportPage />} />
              <Route path="seasons" element={<SeasonManagementPage />} />
              <Route
                path="users"
                element={
                  <AdminOnlyRoute>
                    <UsersAdminPage />
                  </AdminOnlyRoute>
                }
              />
            </Route>
          </Routes>
          </Suspense>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}

export default App
