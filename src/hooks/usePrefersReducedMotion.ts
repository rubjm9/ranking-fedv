import { useEffect, useState } from 'react'

const prefiereMenosMovimiento = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function usePrefersReducedMotion(): boolean {
  // Inicialización diferida: arrancar en `false` y corregir en el efecto dejaba
  // un frame animándose a quien había pedido justo lo contrario.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(prefiereMenosMovimiento)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)

    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  return prefersReducedMotion
}
