import React from 'react'

/**
 * Iconos de superficie (playa y césped).
 *
 * Estaban duplicados en RankingMegaMenu y en RankingPageNew, y en este último
 * definidos *dentro* del cuerpo del componente: React los trataba como un tipo
 * nuevo en cada render y los remontaba. Aquí viven una sola vez.
 */

interface SurfaceIconProps {
  className?: string
}

export const IconBeach: React.FC<SurfaceIconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M3 16c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M3 20c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

export const IconGrass: React.FC<SurfaceIconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M3 20h18" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 20v-4m3 4v-5m3 5v-4m3 4v-6m3 6v-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 15l-1-2m4 2l-1-2m4 2l-1-2m4 2l-1-2m4 2l-1-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)
