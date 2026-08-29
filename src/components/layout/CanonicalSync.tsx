import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { buildCanonicalUrl } from '@/hooks/usePageMeta'

function omitirCanonical(pathname: string): boolean {
  return pathname === '/login' || pathname.startsWith('/admin')
}

/**
 * Sincroniza `<link rel="canonical">` con la ruta actual en cada navegación SPA.
 * Excluye /admin/* y /login, donde un canonical público no aporta valor.
 */
const CanonicalSync: React.FC = () => {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    if (omitirCanonical(pathname)) return

    const href = buildCanonicalUrl(pathname)
    const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (link) link.href = href
  }, [pathname])

  return null
}

export default CanonicalSync
