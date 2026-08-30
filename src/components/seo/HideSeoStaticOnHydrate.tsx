import { useEffect } from 'react'

/** Oculta `#seo-static` tras hidratar; el HTML prerenderizado sigue disponible para crawlers. */
const HideSeoStaticOnHydrate = () => {
  useEffect(() => {
    document.documentElement.classList.add('app-hydrated')
    const seoStatic = document.getElementById('seo-static')
    if (seoStatic) {
      seoStatic.setAttribute('aria-hidden', 'true')
    }
  }, [])

  return null
}

export default HideSeoStaticOnHydrate
