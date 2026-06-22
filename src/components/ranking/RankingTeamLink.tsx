import React from 'react'
import { Link } from 'react-router-dom'
import { getTeamPublicUrl } from '@/services/apiService'

interface RankingTeamLinkProps {
  team: { team_id?: string; slug?: string | null }
  className?: string
  children: React.ReactNode
}

const RankingTeamLink: React.FC<RankingTeamLinkProps> = ({
  team,
  className = 'hover:text-primary-600 transition-colors',
  children,
}) => {
  if (!team?.team_id && !team?.slug) {
    return <>{children}</>
  }

  return (
    <Link to={getTeamPublicUrl({ id: team.team_id, slug: team.slug })} className={className}>
      {children}
    </Link>
  )
}

export default RankingTeamLink
