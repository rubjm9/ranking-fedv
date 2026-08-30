export interface OgImageEntity {
  logo?: string | null
}

const DEFAULT_OG_IMAGE = '/og-image.jpg'

/** URL absoluta de og:image según la entidad; fallback al banner del sitio. */
export function resolveOgImageUrl(
  entity: OgImageEntity | null | undefined,
  siteUrl: string
): string {
  const base = siteUrl.replace(/\/$/, '')
  const fallback = `${base}${DEFAULT_OG_IMAGE}`
  const logo = entity?.logo?.trim()
  if (!logo) return fallback
  if (logo.startsWith('http://') || logo.startsWith('https://')) return logo
  if (logo.startsWith('/')) return `${base}${logo}`
  return fallback
}

export function defaultOgImageUrl(siteUrl: string): string {
  return resolveOgImageUrl(null, siteUrl)
}

const escaparSelector = (valor: string): string =>
  valor.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

export function leerMetaProperty(property: string): string | undefined {
  return document
    .querySelector<HTMLMetaElement>(`meta[property="${escaparSelector(property)}"]`)
    ?.content
}

export function escribirMetaProperty(property: string, content: string): void {
  let meta = document.querySelector<HTMLMetaElement>(`meta[property="${escaparSelector(property)}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('property', property)
    document.head.appendChild(meta)
  }
  meta.content = content
}

export function leerMetaName(name: string): string | undefined {
  return document.querySelector<HTMLMetaElement>(`meta[name="${escaparSelector(name)}"]`)?.content
}

export function escribirMetaName(name: string, content: string): void {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${escaparSelector(name)}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', name)
    document.head.appendChild(meta)
  }
  meta.content = content
}
