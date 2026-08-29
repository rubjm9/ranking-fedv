import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { MemoryRouter, Route, Routes, Link } from 'react-router-dom'
import CanonicalSync from '@/components/layout/CanonicalSync'

const SITE_BASE = 'https://ranking.fedv.es'

function seedHead(canonical = `${SITE_BASE}/`) {
  document.head.innerHTML = `
    <link rel="canonical" href="${canonical}" />
  `
}

function leerCanonical(): string | undefined {
  return document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href
}

function renderApp(initialPath: string) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root: Root = createRoot(container)

  act(() => {
    root.render(
      <MemoryRouter initialEntries={[initialPath]}>
        <CanonicalSync />
        <Routes>
          <Route path="/equipos" element={<div>Equipos</div>} />
          <Route path="/admin/dashboard" element={<div>Admin</div>} />
        </Routes>
        <nav>
          <Link to="/equipos">Ir a equipos</Link>
          <Link to="/equipos?q=test">Equipos con filtro</Link>
          <Link to="/admin/dashboard">Ir a admin</Link>
        </nav>
      </MemoryRouter>
    )
  })

  return {
    root,
    container,
    click: (label: string) => {
      const link = Array.from(container.querySelectorAll('a')).find(
        (a) => a.textContent === label
      )
      if (!link) throw new Error(`Enlace no encontrado: ${label}`)
      act(() => {
        link.click()
      })
    },
    unmount: () => {
      act(() => {
        root.unmount()
      })
      container.remove()
    },
  }
}

describe('CanonicalSync', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SITE_URL', SITE_BASE)
    seedHead()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    document.body.innerHTML = ''
  })

  it('actualiza el canonical al navegar a una ruta pública', () => {
    const app = renderApp('/equipos')
    expect(leerCanonical()).toBe(`${SITE_BASE}/equipos`)
    app.unmount()
  })

  it('ignora query strings en el canonical', () => {
    const app = renderApp('/equipos?q=test')
    expect(leerCanonical()).toBe(`${SITE_BASE}/equipos`)

    app.click('Equipos con filtro')
    expect(leerCanonical()).toBe(`${SITE_BASE}/equipos`)
    app.unmount()
  })

  it('no modifica el canonical en rutas /admin/*', () => {
    const canonicalInicial = `${SITE_BASE}/`
    seedHead(canonicalInicial)

    const app = renderApp('/admin/dashboard')
    expect(leerCanonical()).toBe(canonicalInicial)
    app.unmount()
  })
})
