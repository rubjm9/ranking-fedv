import { useEffect } from 'react'

/** Regiones que quedan fuera de servicio mientras un overlay está abierto. */
const REGIONES = ['#main-content', 'footer', '.bottom-nav']

/**
 * Marca el fondo como `inert` mientras un overlay está abierto.
 *
 * Sin esto, tabular más allá del último elemento del menú móvil llevaba el foco
 * al contenido de detrás, que seguía siendo alcanzable. `inert` lo retira del
 * orden de tabulación y también del árbol de accesibilidad, así que un lector
 * de pantalla tampoco lo recorre.
 */
export function useInertBackground(activo: boolean) {
  useEffect(() => {
    if (!activo) return

    const afectados = REGIONES.flatMap((sel) =>
      Array.from(document.querySelectorAll<HTMLElement>(sel))
    ).filter((el) => !el.inert)

    afectados.forEach((el) => {
      el.inert = true
    })

    return () => {
      afectados.forEach((el) => {
        el.inert = false
      })
    }
  }, [activo])
}
