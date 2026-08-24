import React, { useEffect, useRef, useState } from 'react'

interface WhenVisibleProps {
  children: React.ReactNode
  /** Se muestra mientras el contenido no se ha solicitado todavía. */
  placeholder?: React.ReactNode
  /** Margen para empezar a cargar algo antes de entrar en pantalla. */
  rootMargin?: string
}

/**
 * Renderiza sus hijos la primera vez que el bloque se acerca al viewport.
 *
 * Sirve para que un `lazy()` no se resuelva hasta que hace falta: el onboarding
 * de la home está varias pantallas por debajo del pliegue y arrastraba recharts
 * (~110 kB gzip) a la carga inicial solo por estar montado.
 */
const WhenVisible: React.FC<WhenVisibleProps> = ({
  children,
  placeholder = null,
  rootMargin = '300px',
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (visible) return
    const el = ref.current
    if (!el) return

    // Sin IntersectionObserver se muestra directamente, sin bloquear nada.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { rootMargin }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [visible, rootMargin])

  return <div ref={ref}>{visible ? children : placeholder}</div>
}

export default WhenVisible
