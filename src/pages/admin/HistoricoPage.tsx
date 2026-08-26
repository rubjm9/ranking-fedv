import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { tournamentsService } from '@/services/apiService'
import { Loader2, History } from 'lucide-react'

const SURFACES = ['BEACH', 'GRASS'] as const
const MODALITIES = ['MIXED', 'WOMEN', 'OPEN'] as const
const TYPES = ['CE1', 'CE2', 'REGIONAL'] as const

const TYPE_LABEL: Record<string, string> = { CE1: '1Div', CE2: '2Div', REGIONAL: 'Regs' }
const SURFACE_LABEL: Record<string, string> = { BEACH: 'Playa', GRASS: 'Césped' }
const MODALITY_LABEL: Record<string, string> = { MIXED: 'Mixto', WOMEN: 'Women', OPEN: 'Open' }

function formatSeason(year: number): string {
  const next = (year + 1) % 100
  return `${year}-${String(next).padStart(2, '0')}`
}

export default function HistoricoPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['historico-tournaments'],
    queryFn: async () => {
      const res = await tournamentsService.getForHistorico()
      if (!res.success || !res.data) throw new Error(res.message)
      return res.data as Array<{ id: string; year: number; surface: string; modality: string; type: string; teamCount: number }>
    }
  })

  const tournaments = data ?? []
  const seasons = Array.from(new Set(tournaments.map(t => t.year))).sort((a, b) => b - a)
  const maxYear = Math.max(...seasons, 0)
  const isSeasonClosed = (year: number) => year < maxYear

  // Suma todos los torneos que coinciden (p. ej. todos los regionales de cada región)
  const getCell = (year: number, surface: string, modality: string, type: string): number | '✕' | '' => {
    const matching = tournaments.filter(
      x => x.year === year && x.surface === surface && x.modality === modality && x.type === type
    )
    const total = matching.reduce((sum, t) => sum + t.teamCount, 0)
    if (matching.length > 0) return total
    if (isSeasonClosed(year)) return '✕'
    return ''
  }

  // Césped no tiene regionales; solo Playa tiene Regs
  const typesForSurface = (surface: string) => surface === 'GRASS' ? (['CE1', 'CE2'] as const) : TYPES
  const rowKeys = SURFACES.flatMap(surface =>
    MODALITIES.flatMap(modality =>
      typesForSurface(surface).map(type => ({ surface, modality, type }))
    )
  )

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600 dark:text-red-300">Error al cargar el histórico.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-2">
        <History className="h-8 w-8 text-content-muted" />
        <h1 className="page-header-title">Histórico</h1>
      </div>
      <p className="text-content-muted mb-6">
        Por temporada: número de equipos que participaron en cada campeonato. Cruz (✕) = temporada cerrada sin campeonato; vacío = previsto.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-300" />
        </div>
      ) : (
        <div className="data-table-wrapper rounded-lg border border-line bg-surface">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-muted">
                <th className="px-4 py-3 text-left font-medium text-content-muted border-r border-line w-48">
                  Competición
                </th>
                {seasons.map(year => (
                  <th key={year} className="px-3 py-3 text-center font-medium text-content-muted border-r border-line last:border-r-0 min-w-[4rem]">
                    {formatSeason(year)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {seasons.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-content-subtle">
                    No hay temporadas con campeonatos en la base de datos.
                  </td>
                </tr>
              ) : rowKeys.map(({ surface, modality, type }) => (
                <tr key={`${surface}-${modality}-${type}`} className="border-b border-line hover:bg-surface-muted">
                  <td className="px-4 py-2 font-medium text-content border-r border-line whitespace-nowrap">
                    {SURFACE_LABEL[surface]} – {MODALITY_LABEL[modality]} – {TYPE_LABEL[type]}
                  </td>
                  {seasons.map(year => {
                    const cell = getCell(year, surface, modality, type)
                    return (
                      <td key={year} className="px-3 py-2 text-center border-r border-line last:border-r-0">
                        {cell === '✕' ? (
                          <span className="text-red-500 font-medium" title="Temporada cerrada, campeonato no disputado"><span aria-hidden="true">✕</span><span className="sr-only">Temporada cerrada, campeonato no disputado</span></span>
                        ) : cell === '' ? (
                          <span className="text-content-subtle" aria-hidden="true">—</span>
                        ) : (
                          cell
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
