import React, { useLayoutEffect, useState } from 'react'
import { serializeJsonLd } from '@/utils/structuredData'

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[]
  /** Si el prerender ya incluyó un schema con este @id, no duplicar en React. */
  dedupeById?: string
}

const graphContainsId = (parsed: Record<string, unknown>, id: string): boolean => {
  const graph = parsed['@graph']
  const items = Array.isArray(graph) ? graph : [parsed]
  return items.some((item) => typeof item === 'object' && item !== null && item['@id'] === id)
}

/** Inserta JSON-LD en el DOM para rich results y crawlers con JS. */
const JsonLd: React.FC<JsonLdProps> = ({ data, dedupeById }) => {
  const [shouldRender, setShouldRender] = useState(true)

  useLayoutEffect(() => {
    if (!dedupeById) return
    const scripts = document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')
    for (const script of scripts) {
      try {
        const parsed = JSON.parse(script.textContent || '') as Record<string, unknown>
        if (graphContainsId(parsed, dedupeById)) {
          setShouldRender(false)
          return
        }
      } catch {
        // Ignorar JSON-LD inválido en el head.
      }
    }
  }, [dedupeById])

  if (!shouldRender) return null

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
  )
}

export default JsonLd
