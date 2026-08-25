import { useEffect, useState } from 'react'

/**
 * `true` solo en dispositivos con puntero capaz de hacer hover de verdad.
 *
 * Los navegadores táctiles emulan `mouseenter` y `mouseleave` al tocar y al
 * arrastrar. En un panel que se abre con hover eso provocaba dos problemas:
 * el primer toque lo abría con el evento emulado y lo cerraba acto seguido con
 * el clic, y al desplazar el dedo dentro del panel el `mouseleave` emulado lo
 * hacía desaparecer. Con esto los manejadores de ratón solo se registran donde
 * tienen sentido.
 */
export function useHasHover(): boolean {
  const [hasHover, setHasHover] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches
  )

  useEffect(() => {
    const media = window.matchMedia('(hover: hover)')
    const onChange = () => setHasHover(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return hasHover
}
