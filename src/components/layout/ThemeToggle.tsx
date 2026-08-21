import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

interface ThemeToggleProps {
  /** Sobre un hero oscuro la navbar usa texto claro. */
  isOverHero?: boolean
  className?: string
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isOverHero = false, className = '' }) => {
  const { resolved, toggle } = useTheme()
  const goingDark = resolved === 'light'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={goingDark ? 'Activar tema oscuro' : 'Activar tema claro'}
      className={`inline-flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${
        isOverHero
          ? 'text-slate-200 hover:text-white hover:bg-white/10'
          : 'text-content-muted hover:text-content hover:bg-surface-muted'
      } ${className}`}
    >
      {goingDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  )
}

export default ThemeToggle
