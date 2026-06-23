import React from 'react'
import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'
import PageHeroShell from '@/components/layout/PageHeroShell'

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
      <PageHeroShell className="mb-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
              Ranking <span className="text-accent-400">FEDV</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400 md:text-base">
              Clasificación oficial de equipos de ultimate frisbee en España
            </p>
          </div>
          {season && !isLoadingSeason && (
            <span className="inline-flex shrink-0 items-center self-start rounded-full border border-primary-600/30 bg-primary-600/20 px-3 py-1 text-sm font-semibold text-primary-300">
              Temporada {season}
            </span>
          )}
        </div>
      </PageHeroShell>
      <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-secondary-50 p-3 text-sm text-slate-600">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />
          <p>
            Los puntos se calculan según la metodología oficial FEDV.{' '}
            <Link to="/como-funciona" className="font-medium text-primary-600 hover:text-primary-700">
              Ver metodología
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RankingPageHeader
