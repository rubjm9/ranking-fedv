import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Loader2 } from 'lucide-react'
import { buildRegionPublicSlugById, getRegionPublicUrl, regionsService } from '@/services/apiService'

interface RegionsMenuProps {
  onClose: () => void
}

const RegionsMenu: React.FC<RegionsMenuProps> = ({ onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsService.getAll(),
  })

  const regions = data?.data || []
  const slugById = useMemo(() => buildRegionPublicSlugById(regions), [regions])
  const sortedRegions = useMemo(
    () => [...regions].sort((a, b) => a.name.localeCompare(b.name)),
    [regions]
  )

  return (
    <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl shadow-lg bg-surface border border-line z-50 overflow-hidden">
      <div className="p-2 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-content-subtle">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando regiones...
          </div>
        ) : sortedRegions.length === 0 ? (
          <p className="px-3 py-4 text-sm text-content-subtle">No hay regiones disponibles.</p>
        ) : (
          <ul className="space-y-0.5">
            {sortedRegions.map((region) => (
              <li key={region.id}>
                <Link
                  to={getRegionPublicUrl(region, slugById)}
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-content-muted hover:bg-surface-muted hover:text-content transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                  {region.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-line px-4 py-2.5 bg-surface-muted">
        <Link
          to="/regiones"
          onClick={onClose}
          className="text-xs font-medium text-link hover:text-brand-strong transition-colors"
        >
          Ver todas las regiones →
        </Link>
      </div>
    </div>
  )
}

export default RegionsMenu
