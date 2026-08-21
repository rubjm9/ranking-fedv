import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'ranking-fedv-theme'

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

const readStoredTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // localStorage puede fallar en modo privado; se cae a 'system'.
  }
  return 'system'
}

const resolve = (theme: Theme) => (theme === 'system' ? (prefersDark() ? 'dark' : 'light') : theme)

/** Aplica el tema al <html> y sincroniza la meta theme-color de la barra del sistema. */
const apply = (theme: Theme) => {
  const resolved = resolve(theme)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  document.documentElement.style.colorScheme = resolved

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0b1120' : '#4f46e5')
}

/**
 * Tema claro/oscuro con persistencia y seguimiento de la preferencia del sistema.
 *
 * El primer valor lo aplica un script inline en index.html para evitar el
 * destello de tema claro antes de que hidrate React.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Sin persistencia el tema sigue funcionando durante la sesión.
    }
  }, [])

  useEffect(() => {
    apply(theme)
  }, [theme])

  // Con 'system' hay que reaccionar a los cambios de preferencia del sistema.
  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const resolved = resolve(theme)

  return { theme, resolved, setTheme, toggle: () => setTheme(resolved === 'dark' ? 'light' : 'dark') }
}
