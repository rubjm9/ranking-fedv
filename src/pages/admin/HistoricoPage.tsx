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
        <p className="text-red-600">Error al cargar el histórico.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-2">
        <History className="h-8 w-8 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-900">Histórico</h1>
      </div>
      <p className="text-gray-600 mb-6">
        Por temporada: número de equipos que participaron en cada torneo. Cruz (✕) = temporada cerrada sin torneo; vacío = previsto.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-700 border-r border-gray-200 w-48">
                  Competición
                </th>
                {seasons.map(year => (
                  <th key={year} className="px-3 py-3 text-center font-medium text-gray-700 border-r border-gray-200 last:border-r-0 min-w-[4rem]">
                    {formatSeason(year)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {seasons.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                    No hay temporadas con torneos en la base de datos.
                  </td>
                </tr>
              ) : rowKeys.map(({ surface, modality, type }) => (
                <tr key={`${surface}-${modality}-${type}`} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900 border-r border-gray-200 whitespace-nowrap">
                    {SURFACE_LABEL[surface]} – {MODALITY_LABEL[modality]} – {TYPE_LABEL[type]}
                  </td>
                  {seasons.map(year => {
                    const cell = getCell(year, surface, modality, type)
                    return (
                      <td key={year} className="px-3 py-2 text-center border-r border-gray-100 last:border-r-0">
                        {cell === '✕' ? (
                          <span className="text-red-500 font-medium" title="Temporada cerrada, torneo no disputado">✕</span>
                        ) : cell === '' ? (
                          <span className="text-gray-300">—</span>
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
