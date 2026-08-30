import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { GLOSSARY_TERMS, type GlossaryTerm } from '../../constants/glossary'
import { DIST_DIR } from './html'

const LLMS_HEADER = `# Ranking FEDV — Ultimate Frisbee España

> Sistema oficial de ranking de equipos de Ultimate Frisbee en España,
> gestionado por la Federación Española de Disco Volador (FEDV).

## Qué es este sitio
- Ranking por modalidad: playa, césped, open, women, mixto (6 modalidades)
- Puntos basados en campeonatos oficiales: CE1, CE2 y regionales
- Coeficiente regional que pondera resultados según la región del equipo

## URLs autoritativas
- Inicio: https://ranking.fedv.es/
- Cómo funciona: https://ranking.fedv.es/como-funciona
- Glosario: https://ranking.fedv.es/glosario
- Ranking resumen: https://ranking.fedv.es/ranking/resumen
- Equipos: https://ranking.fedv.es/equipos
- Regiones: https://ranking.fedv.es/regiones
- Campeonatos: https://ranking.fedv.es/campeonatos
- Sitemap: https://ranking.fedv.es/sitemap.xml

## Feeds JSON (generados en cada deploy)
- Índice: https://ranking.fedv.es/data/index.json
- Equipo: https://ranking.fedv.es/data/teams/{slug|id}.json
- Región: https://ranking.fedv.es/data/regions/{slug}.json
- Campeonato: https://ranking.fedv.es/data/tournaments/{slug}.json
- Ranking: https://ranking.fedv.es/data/ranking/{surface}.json

## Glosario`

const LLMS_FOOTER = `
## Organización
- Nombre: Federación Española de Disco Volador (FEDV)
- Web: https://fedv.es
- Contacto: comitedeportivo@fedv.es

## Uso de datos
Los datos de clasificaciones y resultados son públicos. Citar como:
«Ranking FEDV (https://ranking.fedv.es) — Federación Española de Disco Volador».
`

export const buildLlmsTxt = (terms: GlossaryTerm[] = GLOSSARY_TERMS): string => {
  const glossaryLines = terms.map(({ term, definition }) => `- ${term}: ${definition}`)
  return [LLMS_HEADER, ...glossaryLines, LLMS_FOOTER].join('\n')
}

export const writeLlmsTxt = async (distDir = DIST_DIR): Promise<void> => {
  const content = buildLlmsTxt()
  const targetPath = path.join(distDir, 'llms.txt')
  await writeFile(targetPath, content, 'utf8')
  console.log(`llms.txt escrito en ${targetPath}.`)
}
