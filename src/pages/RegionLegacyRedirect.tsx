import React, { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { regionsService } from '@/services/apiService'
import DetailHeaderSkeleton from '@/components/ui/DetailHeaderSkeleton'

const RegionLegacyRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [target, setTarget] = useState<string | null>(null)
  const [redirectState, setRedirectState] = useState<{ resolvedRegionId: string; canonicalSlug: string } | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) {
      setNotFound(true)
      return
    }

    regionsService.resolveRegion(id)
      .then(region => {
        const canonical = region.slug ?? region.id
        setTarget(`/regiones/${canonical}`)
        setRedirectState({
          resolvedRegionId: region.id,
          canonicalSlug: region.slug ?? region.id,
        })
      })
      .catch(() => setNotFound(true))
  }, [id])

  if (notFound) {
    return <Navigate to="/regiones" replace />
  }

  if (target && redirectState) {
    return <Navigate to={target} replace state={redirectState} />
  }

  return <DetailHeaderSkeleton />
}

export default RegionLegacyRedirect
