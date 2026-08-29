import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import NotFoundPage from '@/pages/NotFoundPage'
import { usePageMeta } from '@/hooks/usePageMeta'

function PaginaNormal() {
  usePageMeta({ title: 'Equipos', description: 'Listado de equipos.' })
  return <div>Página normal</div>
}

function PaginaNoindex() {
  usePageMeta({ title: 'Equipo no encontrado', robots: 'noindex' })
  return <div>No encontrado</div>
}

function seedHead() {
  document.head.innerHTML = `
    <title>Ranking FEDV - Ultimate Frisbee España</title>
    <meta name="description" content="Descripción por defecto" />
    <link rel="canonical" href="https://ranking.fedv.es/" />
    <meta name="robots" content="index,follow" />
  `
}

function renderUi(ui: JSX.Element) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root: Root = createRoot(container)
  act(() => {
    root.render(ui)
  })
  return () => {
    act(() => {
      root.unmount()
    })
    container.remove()
  }
}

describe('usePageMeta — robots', () => {
  beforeEach(() => {
    seedHead()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('NotFoundPage pone noindex y una página normal restaura index,follow', () => {
    const unmount404 = renderUi(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    )
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex')

    unmount404()
    seedHead()

    const unmountNormal = renderUi(<PaginaNormal />)
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('index,follow')

    unmountNormal()
  })

  it('robots noindex se aplica cuando se pasa explícitamente', () => {
    const unmount = renderUi(<PaginaNoindex />)
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex')
    unmount()
  })
})
