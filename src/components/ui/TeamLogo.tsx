import React from 'react'

interface TeamLogoProps {
  name: string
  logo?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const TeamLogo: React.FC<TeamLogoProps> = ({ 
  name, 
  logo, 
  size = 'md', 
  className = '' 
}) => {
  // Generar color basado en el nombre del equipo
  const getColorFromName = (teamName: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ]
    
    let hash = 0
    for (let i = 0; i < teamName.length; i++) {
      hash = teamName.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    return colors[Math.abs(hash) % colors.length]
  }

  // Obtener la inicial del equipo
  const getInitial = (teamName: string) => {
    return teamName.charAt(0).toUpperCase()
  }

  // Tamaños
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-xl'
  }

  const colorClass = getColorFromName(name)
  const initial = getInitial(name)
  const sizeClass = sizeClasses[size]

  if (logo) {
    return (
      <img
        src={logo}
        alt={`Logo de ${name}`}
        className={`${sizeClass} rounded-full object-cover ${className}`}
        onError={(e) => {
          // Si falla la imagen, mostrar placeholder
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const placeholder = target.nextElementSibling as HTMLElement
          if (placeholder) {
            placeholder.style.display = 'flex'
          }
        }}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center text-white font-bold ${className}`}
    >
      {initial}
    </div>
  )
}

export default TeamLogo
