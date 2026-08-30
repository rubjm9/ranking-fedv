import { useEffect, useState } from 'react'
import { hasPublicHeroHeader } from '@/utils/publicLayout'

/** Banda vertical que ocupa la navbar flotante: pt-3 (12px) + h-14 (56px). */
const NAV_BAND_PX = 72

/** Marca que un hero oscuro debe teñir la navbar mientras esté bajo ella. */
export const NAV_HERO_ATTR = 'data-nav-hero'

const isHeroUnderNav = () => {
  const hero = document.querySelector<HTMLElement>(`[${NAV_HERO_ATTR}]`)
  if (!hero) return false
  const { top, bottom } = hero.getBoundingClientRect()
  // El hero debe solapar la franja de la navbar (0…NAV_BAND_PX), no solo quedar por debajo.
  return top < NAV_BAND_PX && bottom > 0
}

/**
 * Decide si la navbar debe usar el tema oscuro (`--over-hero`).
 *
 * El tema depende de si un hero oscuro sigue pasando por detrás de la navbar,
 * no de la ruta: al hacer scroll más allá del hero, la barra translúcida oscura
 * quedaría sobre contenido claro y su texto se volvería ilegible.
 *
 * El valor inicial se deriva de la ruta para que la primera pintura sea correcta
 * antes de que el hero exista en el DOM.
 */
export function useNavOverHero(pathname: string): boolean {
  const [isOverHero, setIsOverHero] = useState(() => hasPublicHeroHeader(pathname))

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      setIsOverHero(isHeroUnderNav())
    }

    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    // La ruta acaba de cambiar: el hero puede no estar montado todavía.
    setIsOverHero(hasPublicHeroHeader(pathname))
    schedule()

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    // Capta heroes que se montan tarde (tras resolver datos) sin necesidad de scroll.
    const resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(document.documentElement)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      resizeObserver.disconnect()
    }
  }, [pathname])

  return isOverHero
}
