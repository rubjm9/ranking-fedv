import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { serializeJsonLd } from '../../utils/structuredData'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const DIST_DIR = path.resolve(__dirname, '../../../dist')

export const resolveSiteUrl = (): string => {
  const fromEnv = process.env.VITE_SITE_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return 'https://ranking.fedv.es'
}

export const escapeXml = (text: string): string =>
  text.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      case "'":
        return '&apos;'
      default:
        return ch
    }
  })

export const escapeHtml = escapeXml
export const escapeHtmlAttr = escapeXml

export const isSafePathSegment = (id: string): boolean => {
  if (!id || id.includes('/') || id.includes('\\') || id.includes('..')) return false
  for (let i = 0; i < id.length; i++) {
    const code = id.charCodeAt(i)
    if (code <= 0x1f || code === 0x7f) return false
  }
  return true
}

const replaceMetaContent = (html: string, pattern: RegExp, newContent: string): string =>
  html.replace(pattern, (_match, prefix: string, suffix: string) => `${prefix}${escapeHtmlAttr(newContent)}${suffix}`)

export const buildEntityHtml = (
  template: string,
  {
    title,
    description,
    canonicalUrl,
    omitBrandSuffix = false,
    robots,
  }: {
    title: string
    description: string
    canonicalUrl: string
    omitBrandSuffix?: boolean
    robots?: string
  }
): string => {
  const fullTitle = omitBrandSuffix ? title : `${title} · Ranking FEDV`
  let html = template

  html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtmlAttr(fullTitle)}</title>`)

  html = replaceMetaContent(html, /(<meta\s+name="description"\s+content=")[^"]*(")/, description)
  html = replaceMetaContent(html, /(<meta\s+property="og:title"\s+content=")[^"]*(")/, fullTitle)
  html = replaceMetaContent(html, /(<meta\s+property="og:description"\s+content=")[^"]*(")/, description)
  html = replaceMetaContent(html, /(<meta\s+property="og:url"\s+content=")[^"]*(")/, canonicalUrl)
  html = replaceMetaContent(html, /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/, fullTitle)
  html = replaceMetaContent(html, /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, description)

  html = html.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
    (_match, prefix: string, suffix: string) => `${prefix}${escapeHtmlAttr(canonicalUrl)}${suffix}`
  )

  if (robots) {
    if (/<meta\s+name="robots"/.test(html)) {
      html = replaceMetaContent(html, /(<meta\s+name="robots"\s+content=")[^"]*(")/, robots)
    } else {
      html = html.replace('</head>', `  <meta name="robots" content="${escapeHtmlAttr(robots)}">\n</head>`)
    }
  }

  return html
}

export const buildEntityHtmlWithBody = (
  template: string,
  {
    title,
    description,
    canonicalUrl,
    omitBrandSuffix = false,
    robots,
    jsonLd,
    staticBody,
  }: {
    title: string
    description: string
    canonicalUrl: string
    omitBrandSuffix?: boolean
    robots?: string
    jsonLd?: Record<string, unknown>[]
    staticBody?: string
  }
): string => {
  let html = buildEntityHtml(template, { title, description, canonicalUrl, omitBrandSuffix, robots })

  if (jsonLd && jsonLd.length > 0) {
    const script = `<script type="application/ld+json">${serializeJsonLd(jsonLd)}</script>`
    html = html.replace('</head>', `${script}\n</head>`)
  }

  if (staticBody) {
    const section = `<section id="seo-static" class="seo-static" aria-label="Resumen para buscadores">\n${staticBody}\n</section>\n`
    html = html.replace('<div id="root">', `${section}<div id="root">`)
  }

  return html
}

export const writeEntityHtml = async (
  relativePath: string,
  html: string,
  seenPaths: Set<string>,
  distDir = DIST_DIR
) => {
  const normalizedKey = relativePath.toLowerCase()
  if (seenPaths.has(normalizedKey)) {
    console.warn(`⚠️  Colisión de ruta (case-insensitive): ${relativePath}`)
    return
  }
  seenPaths.add(normalizedKey)

  const filePath = path.join(distDir, relativePath, 'index.html')
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, html, 'utf8')
}

export const writeRootHtml = async (html: string, distDir = DIST_DIR) => {
  await writeFile(path.join(distDir, 'index.html'), html, 'utf8')
}
