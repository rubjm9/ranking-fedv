import React from 'react'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  subtitle?: string
  isLoading?: boolean
  iconColor?: string
  className?: string
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  label,
  value,
  subtitle,
  isLoading = false,
  iconColor = 'text-link',
  className = '',
}) => {
  return (
    <div className={`bg-surface rounded-2xl shadow-sm p-6 ${className}`}>
      <div className="flex items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center">
          <Icon className={`h-7 w-7 ${iconColor}`} strokeWidth={1.5} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-content-muted">{label}</p>
          {isLoading ? (
            <div className="h-8 w-16 bg-line rounded animate-pulse mt-1" />
          ) : (
            <>
              <p className="text-2xl font-bold text-content">{value}</p>
              {subtitle && (
                <p className="text-xs text-content-muted mt-1">{subtitle}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default StatsCard
