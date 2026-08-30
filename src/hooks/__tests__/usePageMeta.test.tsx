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
    <meta property="og:title" content="OG título por defecto" />
    <meta property="og:description" content="OG descripción por defecto" />
    <meta property="og:url" content="https://ranking.fedv.es/" />
    <meta property="og:image" content="https://ranking.fedv.es/og-image.jpg" />
    <meta name="twitter:title" content="Twitter título por defecto" />
    <meta name="twitter:description" content="Twitter descripción por defecto" />
    <meta name="twitter:image" content="https://ranking.fedv.es/og-image.jpg" />
  `
}

function PaginaOg() {
  usePageMeta({
    title: 'Atis Tirma',
    description: 'Equipo de Las Palmas.',
    ogUrl: 'https://ranking.fedv.es/equipos/atis-tirma',
    ogImage: 'https://ranking.fedv.es/logos/atis.png',
  })
  return <div>Equipo</div>
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

describe('usePageMeta — Open Graph y Twitter', () => {
  beforeEach(() => {
    seedHead()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('actualiza og:* y twitter:* con los valores pasados', () => {
    const unmount = renderUi(<PaginaOg />)

    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(
      'Atis Tirma · Ranking FEDV'
    )
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe(
      'Equipo de Las Palmas.'
    )
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      'https://ranking.fedv.es/equipos/atis-tirma'
    )
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://ranking.fedv.es/logos/atis.png'
    )
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe(
      'Atis Tirma · Ranking FEDV'
    )
    expect(document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')).toBe(
      'https://ranking.fedv.es/logos/atis.png'
    )

    unmount()
  })

  it('restaura meta OG/Twitter al desmontar', () => {
    const unmount = renderUi(<PaginaOg />)
    unmount()

    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(
      'OG título por defecto'
    )
    expect(document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')).toBe(
      'https://ranking.fedv.es/og-image.jpg'
    )
  })
})
