import { useLayoutEffect } from 'react'

const SUFIJO = 'Ranking FEDV'

interface PageMeta {
  /** Sin título se conserva el de `index.html`. */
  title?: string
  description?: string
}

const leerDescripcion = () =>
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content

const escribirDescripcion = (valor: string) => {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (meta) meta.content = valor
}

/**
 * Título y descripción de la página.
 *
 * Toda la app compartía el título estático de `index.html`, así que cada
 * pestaña, marcador y enlace compartido decía lo mismo, y `trackPageView`
 * reportaba ese mismo título a GA4 en las 12 rutas.
 *
 * Deliberadamente no toca `meta[name="theme-color"]`: de eso se encargan ya
 * el script anti-destello de `index.html` y `useTheme`. Escribirlo desde un
 * tercer sitio hace parpadear la barra del sistema.
 */
export function usePageMeta({ title, description }: PageMeta): void {
  useLayoutEffect(() => {
    const tituloPrevio = document.title
    const descripcionPrevia = leerDescripcion()

    if (title) document.title = `${title} · ${SUFIJO}`
    if (description) escribirDescripcion(description)

    return () => {
      document.title = tituloPrevio
      if (description && descripcionPrevia !== undefined) {
        escribirDescripcion(descripcionPrevia)
      }
    }
  }, [title, description])
}
