import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, Lock, RefreshCw, CheckCircle, Timer, Minus } from 'lucide-react'
import toast from 'react-hot-toast'
import subseasonAdminService, {
  type SubseasonId,
  type SubseasonMonitorData
} from '@/services/subseasonAdminService'
import seasonPointsService from '@/services/seasonPointsService'
import teamSeasonRankingsService from '@/services/teamSeasonRankingsService'
import { regionsService } from '@/services/apiService'

const COLUMNS: { surface: string; category: string; subseason: SubseasonId }[] = [
  { surface: 'BEACH', category: 'MIXED', subseason: 1 },
  { surface: 'BEACH', category: 'OPEN', subseason: 2 },
  { surface: 'BEACH', category: 'WOMEN', subseason: 2 },
  { surface: 'GRASS', category: 'MIXED', subseason: 3 },
  { surface: 'GRASS', category: 'OPEN', subseason: 4 },
  { surface: 'GRASS', category: 'WOMEN', subseason: 4 }
]

const CATEGORY_LABEL: Record<string, string> = { MIXED: 'Mixto', OPEN: 'Open', WOMEN: 'Women' }

type CellState = 'none' | 'scheduled' | 'played'

interface TableRow {
  type: string
  label: string
  regionId?: string
}

const SubseasonsManagementPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [selectedSeason, setSelectedSeason] = useState('')
  const [loadingSubseason, setLoadingSubseason] = useState<SubseasonId | null>(null)

  const { data: seasonsList } = useQuery({
    queryKey: ['subseason-admin-seasons'],
    queryFn: () => subseasonAdminService.getSeasonsFromDb()
  })

  const { data: regionsResponse } = useQuery({
    queryKey: ['regions-list'],
    queryFn: async () => {
      const res = await regionsService.getAll()
      if (!res.success) throw new Error(res.message)
      return res.data as Array<{ id: string; name: string }>
    }
  })

  const regions = regionsResponse ?? []

  // Precargar la temporada más reciente
  useEffect(() => {
    if (seasonsList?.length && !selectedSeason) {
      setSelectedSeason(seasonsList[0].value)
    }
  }, [seasonsList, selectedSeason])

  const { data: monitorData, isLoading: loadingMonitor } = useQuery({
    queryKey: ['subseason-monitor', selectedSeason],
    queryFn: () => subseasonAdminService.getMonitorData(selectedSeason),
    enabled: !!selectedSeason
  })

  const tableRows: TableRow[] = [
    { type: 'CE1', label: 'Primera división' },
    { type: 'CE2', label: 'Segunda división' },
    ...regions.map(r => ({ type: 'REGIONAL', label: `Regional – ${r.name}`, regionId: r.id }))
  ]

  const handleCloseOrRecalculate = async (subseason: SubseasonId) => {
    if (!selectedSeason) {
      toast.error('Selecciona una temporada')
      return
    }

    const block = monitorData?.subseasons.find(s => s.id === subseason)
    if (!block) return

    const ce1OrCe2WithoutPositions = block.tournaments.filter(
      t => (t.type === 'CE1' || t.type === 'CE2') && !t.hasPositions
    )
    if (ce1OrCe2WithoutPositions.length > 0) {
      const names = ce1OrCe2WithoutPositions.map(t => `${t.name} (${t.type})`).join(', ')
      const ok = window.confirm(
        `Faltan 1ª División o 2ª División por introducir: ${names}. ¿Continuar de todos modos?`
      )
      if (!ok) return
    }

    setLoadingSubseason(subseason)
    try {
      const recalcResult = await seasonPointsService.calculateAndSaveSeasonPoints(
        selectedSeason,
        undefined
      )
      if (!recalcResult.success) {
        toast.error(recalcResult.message)
        return
      }

      const rankingResult = await seasonPointsService.calculateSubseasonRankings(
        selectedSeason,
        subseason
      )
      if (!rankingResult.success) {
        toast.error(rankingResult.message)
        return
      }

      const globalResult = await teamSeasonRankingsService.calculateSeasonRankings(selectedSeason)
      if (!globalResult.success) {
        toast.error(globalResult.message)
        return
      }

      toast.success(
        monitorData?.subseasonClosed?.[subseason]
          ? `Subtemporada ${subseason} recalculada correctamente`
          : `Subtemporada ${subseason} cerrada correctamente`
      )
      queryClient.invalidateQueries({ queryKey: ['subseason-monitor', selectedSeason] })
    } catch (err: any) {
      toast.error(err?.message || 'Error al procesar')
    } finally {
      setLoadingSubseason(null)
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    try {
      const d = new Date(iso)
      return d.toLocaleString('es-ES', {
        dateStyle: 'short',
        timeStyle: 'short'
      })
    } catch {
      return iso
    }
  }

  const getCellState = (
    type: string,
    surface: string,
    category: string,
    regionId?: string
  ): CellState => {
    if (!monitorData?.flatTournaments) return 'none'
    const list = monitorData.flatTournaments.filter(
      t =>
        t.type === type &&
        t.surface === surface &&
        t.category === category &&
        (type !== 'REGIONAL' || t.regionId === regionId)
    )
    if (list.length === 0) return 'none'
    const hasPlayed = list.some(t => t.positionCount > 0)
    return hasPlayed ? 'played' : 'scheduled'
  }

  const renderCellIcon = (state: CellState) => {
    if (state === 'none') {
      return (
        <span className="inline-flex text-gray-300" title="Sin torneo">
          <Minus className="h-4 w-4" />
        </span>
      )
    }
    if (state === 'scheduled') {
      return (
        <span className="inline-flex text-amber-500" title="Programado, sin resultados todavía">
          <Timer className="h-4 w-4" />
        </span>
      )
    }
    return (
      <span className="inline-flex text-green-600" title="Jugado, con resultados registrados">
        <CheckCircle className="h-4 w-4" />
      </span>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Cerrar subtemporadas</h1>
      <p className="text-gray-600 mb-4">
        Revisa los torneos por temporada y cierra o recalcula los rankings cuando corresponda.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Temporada</label>
          <select
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value)}
            className="block rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Selecciona una temporada</option>
            {(seasonsList || []).map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {monitorData?.lastUpdated && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-6">
            <Clock className="w-4 h-4" />
            <span>Última actualización: {formatDate(monitorData.lastUpdated)}</span>
          </div>
        )}
      </div>

      {selectedSeason && (
        <>
          {loadingMonitor ? (
            <p className="text-gray-500 py-4">Cargando datos...</p>
          ) : monitorData ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th rowSpan={2} className="px-4 py-3 text-left font-medium text-gray-700 border-r border-gray-200 w-48 align-middle">
                      Campeonato
                    </th>
                    <th colSpan={3} className="px-2 py-3 text-center font-medium text-gray-700 border-r border-gray-200 bg-gray-100">
                      Playa
                    </th>
                    <th colSpan={3} className="px-2 py-3 text-center font-medium text-gray-700 border-r border-gray-200 last:border-r-0 bg-gray-100">
                      Césped
                    </th>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {COLUMNS.map(col => (
                      <th
                        key={`${col.surface}-${col.category}`}
                        className="px-3 py-2 text-center font-medium text-gray-600 border-r border-gray-200 last:border-r-0 min-w-[4rem]"
                      >
                        {CATEGORY_LABEL[col.category] || col.category}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={row.type === 'REGIONAL' && row.regionId ? `REGIONAL-${row.regionId}` : row.type} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900 border-r border-gray-200 whitespace-nowrap">
                        {row.label}
                      </td>
                      {COLUMNS.map(col => {
                        const state = getCellState(
                          row.type,
                          col.surface,
                          col.category,
                          row.regionId
                        )
                        return (
                          <td
                            key={`${col.surface}-${col.category}`}
                            className="px-3 py-2 text-center border-r border-gray-100 last:border-r-0"
                          >
                            {renderCellIcon(state)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700 border-r border-gray-200">
                      Recalcular subtemporadas
                    </td>
                    {([1, 2, 3, 4] as SubseasonId[]).map(subId => {
                      const colIndices = COLUMNS.map((c, i) => (c.subseason === subId ? i : null)).filter(
                        (i): i is number => i !== null
                      )
                      const colSpan = colIndices.length
                      return (
                        <td
                          key={subId}
                          colSpan={colSpan}
                          className="px-2 py-2 text-center border-r border-gray-200 last:border-r-0 align-middle"
                        >
                          <button
                            type="button"
                            onClick={() => handleCloseOrRecalculate(subId)}
                            disabled={!!loadingSubseason}
                            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {loadingSubseason === subId ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                Procesando...
                              </>
                            ) : monitorData.subseasonClosed?.[subId] ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5" />
                                Recalcular
                              </>
                            ) : (
                              <>
                                <Lock className="h-3.5 w-3.5" />
                                Cerrar subtemporada
                              </>
                            )}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 py-4">No se pudieron cargar los datos.</p>
          )}
        </>
      )}
    </div>
  )
}

export default SubseasonsManagementPage
