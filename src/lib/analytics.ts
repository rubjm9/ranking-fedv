export const COOKIE_NOTICE_KEY = 'ranking-fedv-cookie-notice'
const OPEN_NOTICE_EVENT = 'ranking-fedv:open-cookie-notice'

type GtagCommand = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: GtagCommand
  }
}

let scriptLoaded = false

function getMeasurementId(): string {
  // Acceso vía objeto para que los tests puedan stubbear import.meta.env.
  const env = import.meta.env
  return (env.VITE_GA_MEASUREMENT_ID ?? '').trim()
}

/** True si hay un ID de GA4 válido en el entorno de build. */
export function isAnalyticsConfigured(): boolean {
  return /^G-[A-Z0-9]+$/i.test(getMeasurementId())
}

export function isCookieNoticeAcknowledged(): boolean {
  try {
    return localStorage.getItem(COOKIE_NOTICE_KEY) === 'acknowledged'
  } catch {
    return false
  }
}

export function acknowledgeCookieNotice(): void {
  try {
    localStorage.setItem(COOKIE_NOTICE_KEY, 'acknowledged')
  } catch {
    // Sin persistencia el aviso puede volver a salir.
  }
}

function ensureGtagStub(): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer ?? []
  if (typeof window.gtag === 'function') return
  window.gtag = function gtag() {
    // dataLayer espera el objeto `arguments`, no un array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
}

/**
 * Carga gtag en cuanto hay ID. La navegación implica aceptación tácita.
 */
export function startAnalytics(): void {
  if (scriptLoaded || typeof document === 'undefined' || !isAnalyticsConfigured()) return
  const id = getMeasurementId()
  if (!id) return

  scriptLoaded = true
  ensureGtagStub()
  window.gtag('js', new Date())
  window.gtag('config', id, {
    send_page_view: false,
    anonymize_ip: true,
  })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  document.head.appendChild(script)
}

export function trackPageView(path: string): void {
  if (
    !isAnalyticsConfigured() ||
    typeof window === 'undefined' ||
    typeof window.gtag !== 'function'
  ) {
    return
  }

  if (path.startsWith('/admin')) return

  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  })
}

export function openCookieNotice(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(OPEN_NOTICE_EVENT))
}

export function onOpenCookieNotice(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  window.addEventListener(OPEN_NOTICE_EVENT, handler)
  return () => window.removeEventListener(OPEN_NOTICE_EVENT, handler)
}

/** Solo para tests: permite volver a cargar el script en el mismo proceso. */
export function resetAnalyticsForTests(): void {
  scriptLoaded = false
}

type WebVitalMetric = {
  name: string
  value: number
}

let webVitalsInitialized = false

/** Reporta CLS, INP y LCP a GA4 cuando está configurado. */
export function initWebVitals(): void {
  if (webVitalsInitialized || typeof window === 'undefined' || !isAnalyticsConfigured()) return
  webVitalsInitialized = true

  void import('web-vitals').then(({ onCLS, onINP, onLCP }) => {
    const report = (metric: WebVitalMetric) => {
      if (typeof window.gtag !== 'function') return
      window.gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_category: 'Web Vitals',
        non_interaction: true,
      })
    }

    onCLS(report)
    onINP(report)
    onLCP(report)
  })
}

/** Solo para tests. */
export function resetWebVitalsForTests(): void {
  webVitalsInitialized = false
}
