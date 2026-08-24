import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, 
  MapPin, 
  Calculator, 
  Loader2,
  AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import TableSkeleton from '@/components/ui/TableSkeleton'
import Modal from '@/components/ui/Modal'
import { regionsService, Region } from '@/services/apiService'
import hybridRankingService from '@/services/hybridRankingService'
import seasonService from '@/services/seasonService'
import { getRegionalCoefficientBaseSeason } from '@/utils/rankingCalculations'
import { MODALITIES, MODALITY_SHORT, MODALITY_LABELS, getCoefficientColor } from '@/components/regions/constants'
import ActionButtonGroup from '@/components/ui/ActionButtonGroup'
import AdminPageHeader from '@/components/layout/AdminPageHeader'
import { generateSeasons } from '@/utils/tournamentUtils'

const filterSelectClass =
  'h-7 w-full min-w-[5.5rem] rounded-md border border-line bg-surface px-2 text-xs text-content-muted focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400'

const RegionsAdminPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState('')

  // Obtener regiones desde la API
  const { data: regionsData, isLoading, error } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsService.getAll()
  })

  const { data: currentSeason } = useQuery({
    queryKey: ['most-recent-season'],
    queryFn: () => hybridRankingService.getMostRecentSeason(),
  })

  const defaultCoefficientSeason = currentSeason
    ? getRegionalCoefficientBaseSeason(currentSeason)
    : undefined

  const { data: availableSeasons = [] } = useQuery({
    queryKey: ['regional-coefficient-seasons'],
    queryFn: () => seasonService.listRegionalCoefficientSeasons(),
  })

  useEffect(() => {
    if (defaultCoefficientSeason && !selectedSeason) {
      setSelectedSeason(defaultCoefficientSeason)
    }
  }, [defaultCoefficientSeason, selectedSeason])

  const seasonOptions = useMemo(() => {
    const generated = generateSeasons()
    const seasons =
      availableSeasons.length > 0
        ? availableSeasons
        : defaultCoefficientSeason
          ? [defaultCoefficientSeason]
          : []
    const unique = [...new Set(seasons)]
    if (defaultCoefficientSeason && !unique.includes(defaultCoefficientSeason)) {
      unique.unshift(defaultCoefficientSeason)
    }
    return unique.map(value => {
      const match = generated.find(s => s.value === value)
      return { value, label: match?.label ?? value }
    })
  }, [availableSeasons, defaultCoefficientSeason])

  const { data: regionalCoefficients = [], isLoading: isLoadingCoeffs } = useQuery({
    queryKey: ['regional-coefficients', selectedSeason],
    queryFn: () => seasonService.getRegionalCoefficients(selectedSeason),
    enabled: !!selectedSeason,
  })

  const coeffMap = useMemo(() => {
    const map = new Map<string, Record<string, number>>()
    regionalCoefficients.forEach(c => {
      if (!map.has(c.regionId)) map.set(c.regionId, {})
      map.get(c.regionId)![c.modality] = c.coefficient
    })
    return map
  }, [regionalCoefficients])

  // Mutación para eliminar región
  const deleteRegionMutation = useMutation({
    mutationFn: (id: string) => regionsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] })
      toast.success('Región eliminada exitosamente')
      setShowDeleteModal(false)
      setSelectedRegion(null)
    },
    onError: (error: any) => {
      console.error('Error al eliminar región:', error)
      
      // Manejar diferentes tipos de errores
      if (error.response?.status === 409) {
        toast.error('No se puede eliminar la región porque tiene equipos o torneos asociados. Primero elimina o reasigna los equipos y torneos.')
      } else if (error.response?.status === 404) {
        toast.error('La región no fue encontrada')
      } else if (error.response?.status === 401) {
        toast.error('No tienes permisos para eliminar regiones')
      } else {
        toast.error(error.response?.data?.error || error.response?.data?.message || 'Error al eliminar la región')
      }
    }
  })

  // Mutación para recalcular coeficientes
  const recalculateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSeason) throw new Error('Selecciona una temporada')
      return seasonService.calculateAndSaveRegionalCoefficients(selectedSeason)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['regions'] })
      queryClient.invalidateQueries({ queryKey: ['regional-coefficients'] })
      toast.success(`${result.saved} coeficientes guardados para ${result.season}`)
      setIsRecalculating(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al recalcular coeficientes')
      setIsRecalculating(false)
    }
  })

  const regions = regionsData?.data || []

  const handleDelete = (region: Region) => {
    setSelectedRegion(region)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (selectedRegion) {
      deleteRegionMutation.mutate(selectedRegion.id)
    }
  }

  const handleRecalculateCoefficients = () => {
    setIsRecalculating(true)
    recalculateMutation.mutate()
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error al cargar las regiones</div>
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
        title="Regiones"
        subtitle="Gestiona las regiones del ranking FEDV"
        actions={
          <div className="flex gap-3">
            <button
              onClick={handleRecalculateCoefficients}
              disabled={isRecalculating}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition-colors"
            >
              {isRecalculating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Calculator className="w-4 h-4" />
              )}
              Recalcular coeficientes
            </button>
            <button
              onClick={() => navigate('/admin/regions/new')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva región
            </button>
          </div>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={8} columns={9} />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs text-content-subtle">
              {regions.length} {regions.length === 1 ? 'región' : 'regiones'} encontrada{regions.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="regions-admin-season" className="text-xs text-content-subtle whitespace-nowrap">
                Temporada
              </label>
              <select
                id="regions-admin-season"
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                disabled={!seasonOptions.length}
                className={`${filterSelectClass} w-auto min-w-[6.5rem]`}
              >
                {seasonOptions.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="data-table-wrapper bg-surface rounded-lg shadow">
          <table className="min-w-full divide-y divide-line">
            <thead className="bg-surface-muted border-b border-line">
              <tr>
                <th
                  rowSpan={2}
                  className="px-4 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider border-r border-line align-middle whitespace-nowrap"
                >
                  Región
                </th>
                <th
                  rowSpan={2}
                  className="px-4 py-3 text-center text-xs font-medium text-content-subtle uppercase tracking-wider border-r border-line align-middle whitespace-nowrap"
                >
                  Número de equipos
                </th>
                <th
                  colSpan={MODALITIES.length}
                  className="px-4 py-3 text-center text-xs font-medium text-content-muted uppercase tracking-wider border-r border-line bg-surface-muted"
                >
                  {selectedSeason
                    ? `Coeficientes temporada ${selectedSeason}`
                    : 'Coeficientes temporada'}
                </th>
                <th
                  rowSpan={2}
                  className="px-6 py-3 text-right text-xs font-medium text-content-subtle uppercase tracking-wider align-middle"
                >
                  Acciones
                </th>
              </tr>
              <tr>
                {MODALITIES.map(mod => (
                  <th
                    key={mod}
                    title={MODALITY_LABELS[mod]}
                    className="px-2 py-2 text-center text-xs font-medium text-content-muted border-r border-line last:border-r-0 min-w-[3rem]"
                  >
                    {MODALITY_SHORT[mod]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-line">
              {regions.map((region) => {
                const modCoefs = coeffMap.get(region.id)
                return (
                <tr key={region.id} className="hover:bg-surface-muted">
                  <td className="px-6 py-4 whitespace-nowrap border-r border-line">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-content">{region.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-content text-center border-r border-line">
                    <span className="font-medium">{region._count?.teams || 0}</span>
                  </td>
                  {MODALITIES.map(mod => {
                    const coef = modCoefs?.[mod]
                    return (
                      <td key={mod} className="px-2 py-4 whitespace-nowrap text-center border-r border-line last:border-r-0">
                        {isLoadingCoeffs ? (
                          <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin text-content-subtle" />
                        ) : coef != null ? (
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${getCoefficientColor(coef)}`}>
                            {coef.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs text-content-subtle">—</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end">
                      <ActionButtonGroup
                        onView={() => navigate(`/admin/regions/${region.id}`)}
                        onEdit={() => navigate(`/admin/regions/${region.id}/edit`)}
                        onDelete={() => handleDelete(region)}
                        viewTooltip="Ver detalles"
                        editTooltip="Editar región"
                        deleteTooltip="Eliminar región"
                      />
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Modal de confirmación de eliminación */}
      <Modal
        open={showDeleteModal && !!selectedRegion}
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
              disabled={
                deleteRegionMutation.isPending ||
                (selectedRegion?._count?.teams ?? 0) > 0 ||
                (selectedRegion?._count?.tournaments ?? 0) > 0
              }
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              {deleteRegionMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Eliminar
            </button>
          </>
        }
      >
        {((selectedRegion?._count?.teams ?? 0) > 0 ||
          (selectedRegion?._count?.tournaments ?? 0) > 0) && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-950/40">
            <div className="flex gap-3">
              <AlertTriangle
                className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-300"
                aria-hidden="true"
              />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Datos asociados encontrados
                </h3>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                  {(selectedRegion?._count?.teams ?? 0) > 0 && (
                    <li>{selectedRegion?._count?.teams} equipo(s) asociado(s)</li>
                  )}
                  {(selectedRegion?._count?.tournaments ?? 0) > 0 && (
                    <li>{selectedRegion?._count?.tournaments} torneo(s) asociado(s)</li>
                  )}
                </ul>
                <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>Nota:</strong> No se puede eliminar una región que tiene equipos o
                  torneos asociados.
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-content-muted">
          ¿Estás seguro de que quieres eliminar la región &quot;{selectedRegion?.name}&quot;?
          {(selectedRegion?._count?.teams ?? 0) > 0 ||
          (selectedRegion?._count?.tournaments ?? 0) > 0 ? (
            <span className="font-medium text-red-600 dark:text-red-300">
              {' '}
              Esta acción no se puede realizar mientras tenga datos asociados.
            </span>
          ) : (
            <span> Esta acción no se puede deshacer.</span>
          )}
        </p>
      </Modal>
    </div>
  )
}

export default RegionsAdminPage
