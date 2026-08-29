import { useLayoutEffect } from 'react'

const SUFIJO = 'Ranking FEDV'

interface PageMeta {
  /** Sin título se conserva el de `index.html`. */
  title?: string
  description?: string
  /** URL canónica absoluta, sin query string. Solo actualiza el href existente. */
  canonical?: string
  /** Por defecto `index,follow`. Solo NotFoundPage pasa `noindex`. */
  robots?: string
}

const leerDescripcion = () =>
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content

const escribirDescripcion = (valor: string) => {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (meta) meta.content = valor
}

const escribirCanonical = (href: string) => {
  const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (link) link.href = href
}

const escribirRobots = (content: string) => {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
  if (meta) meta.content = content
}

/** Resuelve la URL base del sitio para canonical absoluto. */
export function resolveSiteBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

/** Normaliza pathname: sin query, sin barra final salvo en `/`. */
export function buildCanonicalUrl(pathname: string, siteBase?: string): string {
  const base = (siteBase ?? resolveSiteBaseUrl()).replace(/\/$/, '')
  let path = pathname.split('?')[0].split('#')[0]
  if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1)
  return `${base}${path}`
}

/**
 * Título, descripción, canonical y robots de la página.
 *
 * Toda la app compartía el título estático de `index.html`, así que cada
 * pestaña, marcador y enlace compartido decía lo mismo, y `trackPageView`
 * reportaba ese mismo título a GA4 en las 12 rutas.
 *
 * Canonical y robots solo hacen upsert del valor; no se restauran en cleanup
 * para evitar una ventana sin canonical en transiciones entre rutas.
 *
 * Deliberadamente no toca `meta[name="theme-color"]`: de eso se encargan ya
 * el script anti-destello de `index.html` y `useTheme`. Escribirlo desde un
 * tercer sitio hace parpadear la barra del sistema.
 */
export function usePageMeta({ title, description, canonical, robots }: PageMeta): void {
  useLayoutEffect(() => {
    const tituloPrevio = document.title
    const descripcionPrevia = leerDescripcion()

    if (title) document.title = `${title} · ${SUFIJO}`
    if (description) escribirDescripcion(description)
    if (canonical) escribirCanonical(canonical)
    escribirRobots(robots ?? 'index,follow')

    return () => {
      document.title = tituloPrevio
      if (description && descripcionPrevia !== undefined) {
        escribirDescripcion(descripcionPrevia)
      }
    }
  }, [title, description, canonical, robots])
}
