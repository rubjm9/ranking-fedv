import { useLayoutEffect } from 'react'
import {
  defaultOgImageUrl,
  escribirMetaName,
  escribirMetaProperty,
  leerMetaName,
  leerMetaProperty,
} from '@/utils/socialMeta'

const SUFIJO = 'Ranking FEDV'

interface PageMeta {
  /** Sin título se conserva el de `index.html`. */
  title?: string
  /** Si true, no añade «· Ranking FEDV» (p. ej. títulos largos de campeonatos). */
  omitBrandSuffix?: boolean
  description?: string
  /** URL canónica absoluta, sin query string. Solo actualiza el href existente. */
  canonical?: string
  /** Por defecto `index,follow`. Solo NotFoundPage pasa `noindex`. */
  robots?: string
  /** Por defecto: título con sufijo de marca. */
  ogTitle?: string
  /** Por defecto: description. */
  ogDescription?: string
  /** Por defecto: canonical o URL absoluta del pathname actual. */
  ogUrl?: string
  /** URL absoluta; por defecto og-image.jpg del sitio. */
  ogImage?: string
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

const leerCanonical = () =>
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href

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

type MetaSnapshot = {
  ogTitle?: string
  ogDescription?: string
  ogUrl?: string
  ogImage?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
}

const leerSnapshotSocial = (): MetaSnapshot => ({
  ogTitle: leerMetaProperty('og:title'),
  ogDescription: leerMetaProperty('og:description'),
  ogUrl: leerMetaProperty('og:url'),
  ogImage: leerMetaProperty('og:image'),
  twitterTitle: leerMetaName('twitter:title'),
  twitterDescription: leerMetaName('twitter:description'),
  twitterImage: leerMetaName('twitter:image'),
})

const restaurarSnapshotSocial = (snapshot: MetaSnapshot) => {
  if (snapshot.ogTitle !== undefined) escribirMetaProperty('og:title', snapshot.ogTitle)
  if (snapshot.ogDescription !== undefined) escribirMetaProperty('og:description', snapshot.ogDescription)
  if (snapshot.ogUrl !== undefined) escribirMetaProperty('og:url', snapshot.ogUrl)
  if (snapshot.ogImage !== undefined) escribirMetaProperty('og:image', snapshot.ogImage)
  if (snapshot.twitterTitle !== undefined) escribirMetaName('twitter:title', snapshot.twitterTitle)
  if (snapshot.twitterDescription !== undefined) escribirMetaName('twitter:description', snapshot.twitterDescription)
  if (snapshot.twitterImage !== undefined) escribirMetaName('twitter:image', snapshot.twitterImage)
}

/**
 * Título, descripción, canonical, robots y meta OG/Twitter de la página.
 *
 * Toda la app compartía el título estático de `index.html`, así que cada
 * pestaña, marcador y enlace compartido decía lo mismo, y `trackPageView`
 * reportaba ese mismo título a GA4 en las 12 rutas.
 *
 * Canonical y robots solo hacen upsert del valor; no se restauran en cleanup
 * para evitar una ventana sin canonical en transiciones entre rutas.
 *
 * OG/Twitter sí se restauran al desmontar para no dejar meta de la ruta anterior.
 */
export function usePageMeta({
  title,
  omitBrandSuffix,
  description,
  canonical,
  robots,
  ogTitle,
  ogDescription,
  ogUrl,
  ogImage,
}: PageMeta): void {
  useLayoutEffect(() => {
    const tituloPrevio = document.title
    const descripcionPrevia = leerDescripcion()
    const socialPrevia = leerSnapshotSocial()
    const siteBase = resolveSiteBaseUrl()

    const tituloCompleto = title
      ? omitBrandSuffix
        ? title
        : `${title} · ${SUFIJO}`
      : undefined

    if (tituloCompleto) document.title = tituloCompleto
    if (description) escribirDescripcion(description)
    if (canonical) escribirCanonical(canonical)
    escribirRobots(robots ?? 'index,follow')

    const resolvedOgTitle = ogTitle ?? tituloCompleto
    const resolvedOgDescription = ogDescription ?? description
    const resolvedOgUrl =
      ogUrl ?? canonical ?? leerCanonical() ?? buildCanonicalUrl(window.location.pathname, siteBase)
    const resolvedOgImage = ogImage ?? defaultOgImageUrl(siteBase)

    if (resolvedOgTitle) escribirMetaProperty('og:title', resolvedOgTitle)
    if (resolvedOgDescription) escribirMetaProperty('og:description', resolvedOgDescription)
    if (resolvedOgUrl) escribirMetaProperty('og:url', resolvedOgUrl)
    if (resolvedOgImage) escribirMetaProperty('og:image', resolvedOgImage)
    if (resolvedOgTitle) escribirMetaName('twitter:title', resolvedOgTitle)
    if (resolvedOgDescription) escribirMetaName('twitter:description', resolvedOgDescription)
    if (resolvedOgImage) escribirMetaName('twitter:image', resolvedOgImage)

    return () => {
      document.title = tituloPrevio
      if (description && descripcionPrevia !== undefined) {
        escribirDescripcion(descripcionPrevia)
      }
      restaurarSnapshotSocial(socialPrevia)
    }
  }, [
    title,
    omitBrandSuffix,
    description,
    canonical,
    robots,
    ogTitle,
    ogDescription,
    ogUrl,
    ogImage,
  ])
}
