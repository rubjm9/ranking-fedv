import React from 'react'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  isLoading?: boolean
  iconBgColor?: string
  iconColor?: string
  className?: string
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  label,
  value,
  isLoading = false,
  iconBgColor = 'bg-primary-100',
  iconColor = 'text-primary-600',
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
      <div className="flex items-center">
        <div className={`p-2 ${iconBgColor} rounded-xl`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          {isLoading ? (
            <div className="h-8 w-16 bg-slate-200 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default StatsCard
