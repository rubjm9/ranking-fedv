import React, { useState } from 'react'

interface TeamLogoProps {
  name: string
  logo?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  /** Para los logos sobre el pliegue, que no deben diferirse. */
  eager?: boolean
}

/** Lado en píxeles de cada tamaño, para dar al `<img>` dimensiones intrínsecas. */
const LADO_PX: Record<NonNullable<TeamLogoProps['size']>, number> = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
}

const TeamLogo: React.FC<TeamLogoProps> = ({
  name,
  logo,
  size = 'md',
  className = '',
  eager = false,
}) => {
  const [imageError, setImageError] = useState(false)

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') {
      return '??' // Iniciales por defecto para nombres inválidos
    }
    return name
      .split(' ')
      .filter(word => word.length >= 3) // Palabras de 3 o más letras
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
    const lado = LADO_PX[size] ?? LADO_PX.md
    return (
      <img
        src={logo}
        // Sin el sufijo «logo»: el lector de pantalla ya anuncia que es una
        // imagen, así que repetirlo solo alarga la lectura.
        alt={name}
        // width/height dan dimensiones intrínsecas y evitan el salto de layout,
        // que es donde más se nota en un listado largo con red lenta.
        width={lado}
        height={lado}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={`rounded-full object-cover ${getSizeClasses()} ${className}`}
        onError={() => setImageError(true)}
      />
    )
  }

  return (
    // Las iniciales solas se leían sin contexto: role + aria-label las
    // convierten en el nombre del equipo.
    <div
      role="img"
      aria-label={name}
      className={`rounded-full flex items-center justify-center text-white font-bold ${getSizeClasses()} ${getColorClass(name)} ${className}`}
    >
      <span aria-hidden="true">{getInitials(name)}</span>
    </div>
  )
}

export default TeamLogo