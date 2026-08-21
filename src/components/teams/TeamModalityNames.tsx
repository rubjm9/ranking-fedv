import React from 'react'
import {
  getTeamModalityNameEntries,
  type TeamNameSource,
} from '@/utils/teamNames'

interface TeamModalityNamesProps {
  team: TeamNameSource & { name?: string | null }
  className?: string
}

const TeamModalityNames: React.FC<TeamModalityNamesProps> = ({ team, className = '' }) => {
  const entries = getTeamModalityNameEntries(team, team.name ?? undefined)

  if (entries.length === 0) return null

  return (
    <div className={`mt-0.5 space-y-0.5 ${className}`}>
      {entries.map(({ label, name }) => (
        <div key={label} className="text-xs text-content-muted">
          <span className="text-content-subtle">{label}:</span> {name}
        </div>
      ))}
    </div>
  )
}

export default TeamModalityNames
