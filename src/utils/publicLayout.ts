/** Rutas públicas cuya cabecera oscura comienza bajo la navbar (estilo hero compacto). */
export const hasPublicHeroHeader = (pathname: string): boolean => {
  if (pathname === '/') return true

  const prefixes = [
    '/equipos',
    '/regiones',
    '/tournaments',
    '/ranking',
    '/como-funciona',
    '/about',
    '/privacy',
    '/terms',
  ]

  return prefixes.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}
