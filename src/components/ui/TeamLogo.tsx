import React, { useState } from 'react'

interface TeamLogoProps {
  name: string
  logo?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const TeamLogo: React.FC<TeamLogoProps> = ({ name, logo, size = 'md' }) => {
  const [imageError, setImageError] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
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
      default: return 'h-10 w-10 text-sm'
    }
  }

  const getColorClass = (name: string) => {
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
        className={`rounded-full object-cover ${getSizeClasses()}`}
        onError={() => setImageError(true)}
      />
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold ${getSizeClasses()} ${getColorClass(name)}`}
    >
      {getInitials(name)}
    </div>
  )
}

export default TeamLogo
