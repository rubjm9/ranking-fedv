import React from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import rankingStateService from '@/services/rankingStateService'

const RankingStaleBanner: React.FC = () => {
  const { data: state, isLoading } = useQuery({
    queryKey: ['ranking-state'],
    queryFn: () => rankingStateService.getRankingState(),
    staleTime: 30_000,
  })

  if (isLoading || !state?.isDirty) return null

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" aria-hidden />
          <div>
            <h3 className="font-medium text-secondary-900">Ranking desactualizado</h3>
            <p className="text-sm text-secondary-700 mt-1">{state.reason}</p>
            {state.affectsCoefficients && (
              <p className="text-sm text-amber-800 mt-2">
                Los cambios pueden afectar a los coeficientes regionales. Usa la actualización
                inteligente para recalcular todo el pipeline.
              </p>
            )}
          </div>
        </div>
        <Link
          to="/admin/seasons"
          className="btn-primary inline-flex items-center gap-2 shrink-0 self-start"
        >
          Actualizar ahora
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  )
}

export default RankingStaleBanner
