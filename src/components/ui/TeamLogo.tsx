import React, { useState } from 'react'

interface TeamLogoProps {
  name: string
  logo?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const TeamLogo: React.FC<TeamLogoProps> = ({ 
  name, 
  logo, 
  size = 'md', 
  className = '' 
}) => {
  const [imageError, setImageError] = useState(false)

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') {
      return '??' // Iniciales por defecto para nombres inválidos
    }
    return name
      .split(' ')
      .filter(word => word.length > 3) // Solo palabras de más de 3 letras
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-8 w-8 text-xs'
      case 'md': return 'h-10 w-10 text-sm'
      case 'lg': return 'h-12 w-12 text-base'
      case 'xl': return 'h-16 w-16 text-lg'
      default: return 'h-10 w-10 text-sm'
    }
  }

  const getColorClass = (name: string) => {
    if (!name || typeof name !== 'string') {
      return 'bg-gray-500' // Color por defecto para nombres inválidos
    }
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
    ]
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  if (logo && !imageError) {
    return (
      <img
        src={logo}
        alt={`${name} logo`}
        className={`rounded-full object-cover ${getSizeClasses()} ${className}`}
        onError={() => setImageError(true)}
      />
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold ${getSizeClasses()} ${getColorClass(name)} ${className}`}
    >
      {getInitials(name)}
    </div>
  )
}

export default TeamLogo