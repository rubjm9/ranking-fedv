import React from 'react'
import { LucideIcon } from 'lucide-react'
import TeamLogo from '@/components/ui/TeamLogo'
import Tooltip from '@/components/ui/Tooltip'
import { cn } from '@/utils/cn'

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
  const textoSobreLogo = useLogoAsBackground && !!logo

  return (
    <div className="relative group h-full flex flex-col">
      <div className="bg-surface rounded-lg border border-line shadow-sm relative overflow-hidden h-full flex flex-col">
        {useLogoAsBackground && logo && (
          <div
            className="absolute inset-0 opacity-20 dark:opacity-15 pointer-events-none rounded-lg overflow-hidden"
            style={{
              backgroundImage: `url(${logo})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center center',
              backgroundSize: 'cover',
            }}
          />
        )}
        <div className="relative z-20 bg-surface/60 backdrop-blur-md px-4 py-2 border-b border-line/50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-content-muted uppercase tracking-wide">{title}</h3>
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
        <div
          className={cn(
            'relative z-10 p-4 pt-3 flex-1 flex flex-col justify-end',
            textoSobreLogo &&
              'bg-gradient-to-t from-surface via-surface/80 to-transparent dark:from-surface dark:via-surface/90'
          )}
        >
          <p
            className={cn(
              'text-lg font-bold text-content break-words line-clamp-2 leading-tight',
              textoSobreLogo &&
                '[text-shadow:0_0_4px_rgba(255,255,255,0.9),0_0_8px_rgba(255,255,255,0.7)] dark:[text-shadow:none]'
            )}
          >
            {value}
          </p>
          <p
            className={cn(
              'text-[10px] text-content-subtle mt-1 leading-tight line-clamp-3 break-words',
              textoSobreLogo &&
                '[text-shadow:0_0_2px_rgba(255,255,255,0.8),0_0_4px_rgba(255,255,255,0.6)] dark:[text-shadow:none]'
            )}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  )
}

export default StatsBlock
