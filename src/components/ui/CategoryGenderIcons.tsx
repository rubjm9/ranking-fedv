import React from 'react'

interface IconProps {
  className?: string
}

/** Símbolo de Marte (♂) — Open / masculino */
export const IconMars: React.FC<IconProps> = ({ className = 'h-5 w-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="10" cy="14" r="5" />
    <path d="M14.5 9.5L19 5" />
    <path d="M15 5h4v4" />
  </svg>
)

/** Símbolo de Venus (♀) — Women / femenino */
export const IconVenus: React.FC<IconProps> = ({ className = 'h-5 w-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="9" r="5" />
    <path d="M12 14v7" />
    <path d="M9 17h6" />
  </svg>
)

/** Símbolos ♀ y ♂ juntos — Mixto (femenino izq., masculino dch.) */
export const IconMixedGender: React.FC<IconProps> = ({ className = 'h-5 w-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Venus (izquierda) */}
    <circle cx="7.5" cy="9.5" r="3.5" />
    <path d="M7.5 13v4" />
    <path d="M5.75 15.25h3.5" />
    {/* Marte (derecha) — flecha hacia arriba-derecha, lejos del ♀ */}
    <circle cx="16.5" cy="14.5" r="3.5" />
    <path d="M19 11.5L21.5 9" />
    <path d="M20 9h1.5v1.5" />
  </svg>
)
