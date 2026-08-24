import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, MapPin, Loader2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import TableSkeleton from '@/components/ui/TableSkeleton'
import TableColumnFilter from '@/components/ui/TableColumnFilter'
import { teamsService, regionsService, Team, getTeamPublicUrl } from '@/services/apiService'
import TeamLogo from '@/components/ui/TeamLogo'
import ActionButtonGroup from '@/components/ui/ActionButtonGroup'
import AdminPageHeader from '@/components/layout/AdminPageHeader'

const filterSelectClass =
  'h-7 w-full min-w-[5.5rem] rounded-md border border-line bg-surface px-2 text-xs text-content-muted focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400'

const TeamsAdminPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  // Obtener equipos desde la API
  const { data: teamsData, isLoading, error } = useQuery({
    queryKey: ['teams', searchTerm, selectedRegion],
    queryFn: () => teamsService.getAll({
      search: searchTerm || undefined,
      region: selectedRegion !== 'all' ? selectedRegion : undefined
    })
  })

  // Obtener regiones desde la API
  const { data: regionsData } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsService.getAll()
  })

  // Mutación para eliminar equipo
  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => teamsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast.success('Equipo eliminado exitosamente')
      setShowDeleteModal(false)
      setSelectedTeam(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar el equipo')
    }
  })

  const teams = teamsData?.data || []

  const handleDelete = (team: Team) => {
    setSelectedTeam(team)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (selectedTeam) {
      deleteTeamMutation.mutate(selectedTeam.id)
    }
  }

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.location?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = selectedRegion === 'all' || team.region?.id === selectedRegion
    return matchesSearch && matchesRegion
  })

  const hasActiveFilters = searchTerm.length > 0 || selectedRegion !== 'all'

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedRegion('all')
  }

  const stopPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation()
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error al cargar los equipos</div>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Equipos"
        subtitle="Gestiona los equipos del ranking FEDV"
        actions={
          <button
            onClick={() => navigate('/admin/teams/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo equipo
          </button>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={8} columns={5} showLeadingAvatar />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs text-content-subtle">
              {filteredTeams.length} equipo{filteredTeams.length !== 1 ? 's' : ''} encontrado{filteredTeams.length !== 1 ? 's' : ''}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-content-subtle hover:text-link transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="bg-surface rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-line">
            <thead className="bg-surface-muted border-b border-line">
              <tr>
                <TableColumnFilter label="Equipo" sortIcon="none" active={!!searchTerm}>
                  <div className="relative min-w-[10rem]">
                    <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-content-subtle" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={stopPropagation}
                      className={`${filterSelectClass} pl-7`}
                    />
                  </div>
                </TableColumnFilter>

                <TableColumnFilter label="Región" sortIcon="none" active={selectedRegion !== 'all'}>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    onClick={stopPropagation}
                    className={filterSelectClass}
                  >
                    <option value="all">Todas</option>
                    {regionsData?.data?.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </TableColumnFilter>

                <TableColumnFilter label="Fecha creación" sortIcon="none" />
                <TableColumnFilter label="Acciones" sortIcon="none" className="text-right" />
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-line">
              {filteredTeams.map((team) => (
                <tr key={team.id} className="hover:bg-surface-muted">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <TeamLogo 
                          name={team.name} 
                          logo={team.logo} 
                          size="md"
                        />
                      </div>
                      <div className="ml-4">
                        <Link
                          to={`/admin/teams/${team.id}/edit`}
                          className="text-sm font-medium text-content hover:text-link transition-colors"
                        >
                          {team.name}
                        </Link>
                        <div className="text-sm text-content-subtle">{team.location || 'Sin ubicación'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-content-subtle mr-2" />
                      <span className="text-sm text-content">{team.region?.name || 'Sin región'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-content-subtle">
                    {new Date(team.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end">
                      <ActionButtonGroup
                        onView={() => navigate(getTeamPublicUrl(team))}
                        onEdit={() => navigate(`/admin/teams/${team.id}/edit`)}
                        onDelete={() => handleDelete(team)}
                        viewTooltip="Ver detalles"
                        editTooltip="Editar equipo"
                        deleteTooltip="Eliminar equipo"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Modal de confirmación de eliminación */}
      <Modal
        open={showDeleteModal && !!selectedTeam}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar eliminación"
        size="md"
        footer={
          <>
            <button onClick={() => setShowDeleteModal(false)} className="btn-outline min-h-[44px]">
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleteTeamMutation.isPending}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              {deleteTeamMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Eliminar
            </button>
          </>
        }
      >
        <p className="text-content-muted">
          ¿Estás seguro de que quieres eliminar el equipo &quot;{selectedTeam?.name}&quot;? Esta
          acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  )
}

export default TeamsAdminPage
