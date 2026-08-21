import { useCallback, useEffect, useRef, useState } from 'react'

export type ViewMode = 'table' | 'cards'

/** Breakpoint `md` de Tailwind: por debajo, las tablas anchas no caben. */
const TABLE_MIN_WIDTH = '(min-width: 768px)'

const fitsTable = () =>
  typeof window !== 'undefined' && window.matchMedia(TABLE_MIN_WIDTH).matches

/**
 * Modo de vista tarjetas/tabla para listados densos.
 *
 * En móvil arranca en tarjetas: las tablas de esta app tienen 4-8 columnas y
 * dejaban los puntos —el dato principal— fuera de pantalla. En cuanto el
 * usuario elige un modo, su decisión manda y deja de seguir al breakpoint.
 */
export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>(() => (fitsTable() ? 'table' : 'cards'))
  const chosenByUser = useRef(false)

  const choose = useCallback((next: ViewMode) => {
    chosenByUser.current = true
    setMode(next)
  }, [])

  useEffect(() => {
    const media = window.matchMedia(TABLE_MIN_WIDTH)
    const onChange = () => {
      if (chosenByUser.current) return
      setMode(media.matches ? 'table' : 'cards')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return [mode, choose]
}
