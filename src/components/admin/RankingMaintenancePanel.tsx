import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calculator,
  TrendingUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import rankingUpdateService, { type UpdateResult } from '@/services/rankingUpdateService'
import seasonPointsService from '@/services/seasonPointsService'

interface RankingMaintenancePanelProps {
  selectedSeason: string
}

const RankingMaintenancePanel: React.FC<RankingMaintenancePanelProps> = ({ selectedSeason }) => {
  const queryClient = useQueryClient()
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isRecalcCoeffs, setIsRecalcCoeffs] = useState(false)
  const [isRegeneratingSeason, setIsRegeneratingSeason] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [lastResult, setLastResult] = useState<UpdateResult | null>(null)

  const invalidateCaches = () => {
    queryClient.invalidateQueries({ queryKey: ['subseason-monitor'] })
    queryClient.invalidateQueries({ queryKey: ['ranking-state'] })
    queryClient.invalidateQueries({ queryKey: ['admin-notifications-pending'] })
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard-actions'] })
    queryClient.invalidateQueries({ queryKey: ['regional-coefficients'] })
  }

  const handleSmartUpdate = async () => {
    if (
      !confirm(
        '¿Ejecutar actualización inteligente? Recalcula posiciones, coeficientes regionales, puntos por temporada y rankings públicos. Puede tardar varios minutos.'
      )
    ) {
      return
    }

    setIsRebuilding(true)
    setLastResult(null)
    try {
      const result = await rankingUpdateService.rebuildEverything()
      setLastResult(result)
      if (result.success) {
        toast.success(result.message)
        invalidateCaches()
      } else {
        toast.error(result.message)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    } finally {
      setIsRebuilding(false)
    }
  }

  const handleSyncRankingsOnly = async () => {
    setIsSyncing(true)
    try {
      const result = await rankingUpdateService.syncCurrentRankingsOnly()
      if (result.success) {
        toast.success(result.message)
        invalidateCaches()
      } else {
        toast.error(result.message)
      }
    } finally {
      setIsSyncing(false)
    }
  }

  const handleRecalcCoeffsOnly = async () => {
    setIsRecalcCoeffs(true)
    try {
      const result = await rankingUpdateService.recalculateRegionalCoefficientsOnly()
      if (result.success) {
        toast.success(result.message)
        invalidateCaches()
      } else {
        toast.error(result.message)
      }
    } finally {
      setIsRecalcCoeffs(false)
    }
  }

  const handleRegenerateSeasonOnly = async () => {
    if (!selectedSeason) {
      toast.error('Selecciona una temporada')
      return
    }
    setIsRegeneratingSeason(true)
    try {
      const result = await seasonPointsService.calculateAndSaveSeasonPoints(selectedSeason)
      if (result.success) {
        toast.success(result.message)
        invalidateCaches()
      } else {
        toast.error(result.message)
      }
    } finally {
      setIsRegeneratingSeason(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-secondary-900 mb-2">Actualización del ranking</h2>
      <p className="text-sm text-secondary-600 mb-4">
        Flujo recomendado tras editar torneos o resultados: recalcula posiciones, coeficientes
        regionales (si afectan CE1/CE2), puntos por temporada y rankings públicos.
      </p>

      <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-4 mb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 shrink-0 text-primary-600 mt-0.5" aria-hidden />
            <div>
              <h3 className="font-medium text-secondary-900">Actualización inteligente</h3>
              <p className="text-sm text-secondary-600 mt-1">
                Ejecuta los 4 pasos en orden: posiciones → coeficientes → puntos → rankings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSmartUpdate}
            disabled={isRebuilding}
            className="btn-primary flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRebuilding ? 'animate-spin' : ''}`} aria-hidden />
            {isRebuilding ? 'Actualizando...' : 'Actualización inteligente'}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-secondary-700 hover:text-primary-600 transition-colors"
        aria-expanded={showAdvanced}
      >
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        Opciones avanzadas
      </button>

      {showAdvanced && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleRegenerateSeasonOnly}
            disabled={isRegeneratingSeason || !selectedSeason}
            className="flex items-center justify-center gap-2 rounded-lg border border-secondary-200 px-4 py-3 text-sm font-medium text-secondary-800 hover:bg-secondary-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isRegeneratingSeason ? 'animate-spin' : ''}`} />
            Regenerar puntos (temporada)
          </button>
          <button
            type="button"
            onClick={handleRecalcCoeffsOnly}
            disabled={isRecalcCoeffs}
            className="flex items-center justify-center gap-2 rounded-lg border border-secondary-200 px-4 py-3 text-sm font-medium text-secondary-800 hover:bg-secondary-50 disabled:opacity-50 transition-colors"
          >
            <Calculator className={`h-4 w-4 ${isRecalcCoeffs ? 'animate-spin' : ''}`} />
            Recalcular coeficientes
          </button>
          <button
            type="button"
            onClick={handleSyncRankingsOnly}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 rounded-lg border border-secondary-200 px-4 py-3 text-sm font-medium text-secondary-800 hover:bg-secondary-50 disabled:opacity-50 transition-colors"
          >
            <TrendingUp className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Reconstruir rankings
          </button>
        </div>
      )}

      {lastResult && (
        <div
          className={`mt-4 rounded-lg border p-4 ${
            lastResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-start gap-2 mb-3">
            {lastResult.success ? (
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <p className={`text-sm font-medium ${lastResult.success ? 'text-emerald-900' : 'text-red-900'}`}>
              {lastResult.message}
            </p>
          </div>
          <div className="space-y-2 text-xs text-secondary-700">
            {[
              { label: 'Posiciones', step: lastResult.steps.recomputePositions },
              { label: 'Coeficientes regionales', step: lastResult.steps.regionalCoefficients },
              { label: 'Puntos por temporada', step: lastResult.steps.regenerateSeasons },
              { label: 'Rankings públicos', step: lastResult.steps.rebuildRankings },
            ].map(({ label, step }) => (
              <div key={label} className="flex items-center gap-2">
                {step.success ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                )}
                <span>
                  <strong>{label}:</strong> {step.message || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RankingMaintenancePanel
