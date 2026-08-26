import React, { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'
import PageHeroShell from '@/components/layout/PageHeroShell'

interface RankingPageHeaderProps {
  title?: string
  season?: string
  isLoadingSeason?: boolean
  actions?: ReactNode
}

/** Estilo del H1: «Ranking» (y «combinado») en blanco; modalidad o FEDV en accent. */
const renderHeroTitle = (title: string) => {
  if (title.includes('FEDV')) {
    const [before, ...after] = title.split('FEDV')
    return (
      <>
        {before}
        <span className="text-accent-400">FEDV</span>
        {after.join('FEDV')}
      </>
    )
  }

  // «Ranking combinado Playa» → Ranking combinado en blanco, modalidad en naranja
  const combinedMatch = title.match(/^(Ranking combinado)\s+(.+)$/i)
  if (combinedMatch) {
    return (
      <>
        {combinedMatch[1]} <span className="text-accent-400">{combinedMatch[2]}</span>
      </>
    )
  }

  const match = title.match(/^(Ranking)\s+(.+)$/)
  if (match) {
    return (
      <>
        {match[1]} <span className="text-accent-400">{match[2]}</span>
      </>
    )
  }

  return title
}

const RankingPageHeader: React.FC<RankingPageHeaderProps> = ({
  title = 'Ranking FEDV',
  season,
  isLoadingSeason,
  actions,
}) => {
  return (
    <div className="mb-6">
      <PageHeroShell className="mb-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
              {renderHeroTitle(title)}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-content-subtle md:text-base">
              Clasificación oficial de equipos de ultimate frisbee en España
            </p>
          </div>
          {(actions || (season && !isLoadingSeason)) && (
            <div className="flex shrink-0 flex-wrap items-center gap-2 self-start">
              {season && !isLoadingSeason && (
                <span className="inline-flex items-center rounded-full border border-primary-600/30 bg-primary-600/20 px-3 py-1 text-sm font-semibold text-primary-300">
                  Temporada {season}
                </span>
              )}
              {actions}
            </div>
          )}
        </div>
      </PageHeroShell>
      <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-2 rounded-xl border border-line bg-surface-muted p-3 text-sm text-content-muted">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-link" />
          <p>
            Los puntos se calculan según la metodología oficial FEDV.{' '}
            <Link to="/como-funciona" className="font-medium text-link hover:text-brand-strong">
              Ver metodología
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RankingPageHeader
