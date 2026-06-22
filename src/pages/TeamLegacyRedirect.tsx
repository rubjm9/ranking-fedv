import React, { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { teamsService } from '@/services/apiService'
import { prefetchTeamDetail } from '@/services/teamDetailService'
import DetailHeaderSkeleton from '@/components/ui/DetailHeaderSkeleton'

const TeamLegacyRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [target, setTarget] = useState<string | null>(null)
  const [redirectState, setRedirectState] = useState<{ resolvedTeamId: string; canonicalSlug: string } | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) {
      setNotFound(true)
      return
    }

    teamsService.resolveTeam(id)
      .then((team) => {
        const canonicalSlug = team.slug ?? team.id
        prefetchTeamDetail(team.id)
        setTarget(`/equipos/${canonicalSlug}`)
        setRedirectState({
          resolvedTeamId: team.id,
          canonicalSlug,
        })
      })
      .catch(() => setNotFound(true))
  }, [id])

  if (notFound) {
    return <Navigate to="/equipos" replace />
  }

  if (target && redirectState) {
    return <Navigate to={target} replace state={redirectState} />
  }

  return (
    <>
      <DetailHeaderSkeleton variant="team" />
      <div className="flex items-center justify-center min-h-[20vh]">
        <p className="text-slate-500">Redirigiendo...</p>
      </div>
    </>
  )
}

export default TeamLegacyRedirect
