import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  acknowledgeCookieNotice,
  initWebVitals,
  isAnalyticsConfigured,
  isCookieNoticeAcknowledged,
  onOpenCookieNotice,
  startAnalytics,
  trackPageView,
} from '@/lib/analytics'

function currentPath(pathname: string, search: string): string {
  return `${pathname}${search}`
}

/**
 * Carga Analytics al navegar (aceptación tácita) y muestra un aviso informativo.
 */
const AnalyticsRoot: React.FC = () => {
  const location = useLocation()
  const [bannerOpen, setBannerOpen] = useState(false)
  const configured = isAnalyticsConfigured()

  useEffect(() => {
    if (!configured) return

    startAnalytics()
    initWebVitals()
    if (!isCookieNoticeAcknowledged()) setBannerOpen(true)

    return onOpenCookieNotice(() => setBannerOpen(true))
  }, [configured])

  useEffect(() => {
    if (!configured) return
    startAnalytics()
    initWebVitals()
    trackPageView(currentPath(location.pathname, location.search))
  }, [configured, location.pathname, location.search])

  if (!configured || !bannerOpen) return null

  const dismiss = () => {
    acknowledgeCookieNotice()
    initWebVitals()
    setBannerOpen(false)
  }

  return (
    <div
      className="fixed z-50 inset-x-3 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] md:inset-x-auto md:right-4 md:bottom-4 md:max-w-md"
      role="dialog"
      aria-labelledby="cookie-notice-title"
      aria-describedby="cookie-notice-desc"
    >
      <div className="max-h-[70dvh] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface/95 p-4 shadow-lg backdrop-blur-xl sm:p-5">
        <h2 id="cookie-notice-title" className="font-display text-base font-semibold text-content">
          Cookies de analítica
        </h2>
        <p id="cookie-notice-desc" className="mt-2 text-sm text-content-muted">
          La navegación en esta web implica la aceptación de cookies con el
          único propósito de elaborar estadísticas de uso.{' '}
          <Link to="/privacy" className="text-link hover:text-brand-strong underline-offset-2 hover:underline">
            Más información
          </Link>
        </p>
        <div className="mt-4 flex justify-stretch sm:justify-end">
          <button
            type="button"
            className="btn-primary min-h-[44px] w-full touch-manipulation sm:w-auto"
            onClick={dismiss}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsRoot
