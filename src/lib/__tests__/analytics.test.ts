import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  COOKIE_NOTICE_KEY,
  acknowledgeCookieNotice,
  isAnalyticsConfigured,
  isCookieNoticeAcknowledged,
  resetAnalyticsForTests,
  startAnalytics,
  trackPageView,
} from '../analytics'

const GA_ID = 'G-TEST1234'

function stubMeasurementId(value: string) {
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', value)
}

describe('analytics', () => {
  beforeEach(() => {
    resetAnalyticsForTests()
    localStorage.clear()
    document.head.innerHTML = ''
    window.dataLayer = []
    // @ts-expect-error reset entre tests
    delete window.gtag
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    resetAnalyticsForTests()
  })

  it('no se considera configurado sin un ID G-*', () => {
    stubMeasurementId('')
    expect(isAnalyticsConfigured()).toBe(false)

    stubMeasurementId('not-a-ga-id')
    expect(isAnalyticsConfigured()).toBe(false)
  })

  it('reconoce un ID de medición de GA4', () => {
    stubMeasurementId(GA_ID)
    expect(isAnalyticsConfigured()).toBe(true)
  })

  it('carga gtag al iniciar, sin esperar al aviso', () => {
    stubMeasurementId(GA_ID)
    startAnalytics()

    const script = document.head.querySelector('script')
    expect(script?.src).toContain(`id=${GA_ID}`)
    expect(isCookieNoticeAcknowledged()).toBe(false)
  })

  it('registra pageviews públicas tras iniciar', () => {
    stubMeasurementId(GA_ID)
    startAnalytics()

    trackPageView('/ranking/resumen')
    const events = window.dataLayer as unknown as Array<IArguments>
    const pageView = Array.from(events).find((entry) => {
      const args = Array.from(entry as unknown as unknown[])
      return args[0] === 'event' && args[1] === 'page_view'
    })
    expect(pageView).toBeTruthy()
  })

  it('no envía pageviews del panel de administración', () => {
    stubMeasurementId(GA_ID)
    startAnalytics()
    const before = window.dataLayer.length

    trackPageView('/admin/dashboard')
    expect(window.dataLayer.length).toBe(before)
  })

  it('persiste el cierre del aviso en localStorage', () => {
    expect(isCookieNoticeAcknowledged()).toBe(false)
    acknowledgeCookieNotice()
    expect(isCookieNoticeAcknowledged()).toBe(true)
    expect(localStorage.getItem(COOKIE_NOTICE_KEY)).toBe('acknowledged')
  })
})
