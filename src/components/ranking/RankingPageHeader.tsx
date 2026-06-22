import React from 'react'
import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'

interface RankingPageHeaderProps {
  season?: string
  isLoadingSeason?: boolean
}

const RankingPageHeader: React.FC<RankingPageHeaderProps> = ({
  season,
  isLoadingSeason,
}) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            Ranking FEDV
          </h1>
          <p className="mt-2 text-slate-600">
            Clasificación oficial de equipos de Ultimate Frisbee en España
          </p>
        </div>
        {season && !isLoadingSeason && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-800 rounded-xl text-sm font-medium">
            Temporada {season}
          </div>
        )}
      </div>
      <div className="mt-4 flex items-start gap-2 p-3 bg-secondary-50 border border-slate-200 rounded-xl text-sm text-slate-600">
        <Info className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
        <p>
          Los puntos se calculan según la metodología oficial FEDV.{' '}
          <Link to="/como-funciona" className="text-primary-600 hover:text-primary-700 font-medium">
            Ver metodología
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RankingPageHeader
