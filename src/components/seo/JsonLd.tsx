import React from 'react'
import { serializeJsonLd } from '@/utils/structuredData'

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[]
}

/** Inserta JSON-LD en el DOM para rich results y crawlers con JS. */
const JsonLd: React.FC<JsonLdProps> = ({ data }) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
)

export default JsonLd
