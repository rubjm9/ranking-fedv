import React from 'react'
import { LucideIcon } from 'lucide-react'
import TeamLogo from '@/components/ui/TeamLogo'
import Tooltip from '@/components/ui/Tooltip'

export interface StatsBlockProps {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  color?: string
  logo?: string | null
  teamName?: string
  tooltip?: string
  useLogoAsBackground?: boolean
}

const StatsBlock: React.FC<StatsBlockProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  logo,
  teamName,
  tooltip,
  useLogoAsBackground = false,
}) => {
  return (
    <div className="relative group h-full flex flex-col">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm relative overflow-hidden h-full flex flex-col">
        {useLogoAsBackground && logo && (
          <div
            className="absolute inset-0 opacity-20 pointer-events-none rounded-lg overflow-hidden"
            style={{
              backgroundImage: `url(${logo})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center center',
              backgroundSize: 'cover',
            }}
          />
        )}
        <div className="relative z-20 bg-white/60 backdrop-blur-md px-4 py-2 border-b border-slate-200/50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-slate-600 uppercase tracking-wide">{title}</h3>
            {tooltip && <Tooltip content={tooltip} />}
          </div>
        </div>
        {!useLogoAsBackground && (
          <div className="absolute top-1/2 right-3 transform -translate-y-1/2 z-10">
            {logo && teamName ? (
              <TeamLogo name={teamName} logo={logo} size="md" />
            ) : (
              <Icon className="w-4 h-4 opacity-40" />
            )}
          </div>
        )}
        <div className="relative z-10 p-4 pt-3 flex-1 flex flex-col justify-end">
          <p
            className="text-lg font-bold text-slate-900 break-words line-clamp-2 leading-tight"
            style={{ textShadow: '0 0 4px rgba(255, 255, 255, 0.9), 0 0 8px rgba(255, 255, 255, 0.7)' }}
          >
            {value}
          </p>
          <p
            className="text-[10px] text-slate-500 mt-1 leading-tight line-clamp-3 break-words"
            style={{ textShadow: '0 0 2px rgba(255, 255, 255, 0.8), 0 0 4px rgba(255, 255, 255, 0.6)' }}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  )
}

export default StatsBlock
