import React, { useId, useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'

interface TooltipProps {
  content: string
  children?: React.ReactNode
  className?: string
}

/** Ancho del panel (w-64) y margen mínimo al borde del viewport. */
const PANEL_WIDTH = 256
const VIEWPORT_MARGIN = 8
/** Espacio necesario encima del disparador para no salir por arriba. */
const FLIP_THRESHOLD = 140

const Tooltip: React.FC<TooltipProps> = ({ content, children, className = '' }) => {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number; below: boolean } | null>(null)

  const updatePosition = useCallback(() => {
    const el = buttonRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()

    // Sin clamp el panel se sale por los lados en móvil (256px sobre 390px de ancho).
    const half = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2) / 2
    const center = rect.left + rect.width / 2
    const left = Math.min(
      Math.max(center, VIEWPORT_MARGIN + half),
      window.innerWidth - VIEWPORT_MARGIN - half
    )

    const below = rect.top < FLIP_THRESHOLD
    setCoords({ top: below ? rect.bottom : rect.top, left, below })
  }, [])

  useLayoutEffect(() => {
    if (!visible) {
      setCoords(null)
      return
    }
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [visible, updatePosition])

  // En táctil el tooltip se abre con tap, así que necesita cierres explícitos.
  useEffect(() => {
    if (!visible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisible(false)
    }
    const handlePointerDown = (e: PointerEvent) => {
      if (!buttonRef.current?.contains(e.target as Node)) setVisible(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [visible])

  return (
    <>
      <div className={`relative inline-flex ${className}`}>
        {/*
          El botón ocupa 44px reales para el hit-testing y el punto visible sigue
          midiendo 16px. Ampliarlo con un ::before no servía: las tarjetas con
          `overflow-hidden` recortaban el pseudoelemento por arriba.
        */}
        <button
          ref={buttonRef}
          type="button"
          className="group inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-describedby={visible ? id : undefined}
          aria-expanded={visible}
          onClick={() => setVisible((prev) => !prev)}
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}
          onFocus={() => setVisible(true)}
          onBlur={() => setVisible(false)}
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-line transition-colors group-hover:bg-line-strong">
            {children ?? <Info className="w-2.5 h-2.5 text-content-muted" aria-hidden="true" />}
          </span>
          <span className="sr-only">Más información</span>
        </button>
      </div>
      {visible && coords && createPortal(
        <div
          id={id}
          role="tooltip"
          className="fixed w-64 max-w-[calc(100vw-1rem)] p-3 bg-slate-900 text-white text-xs rounded-lg shadow-lg ring-1 ring-white/10 z-[9999] pointer-events-none"
          style={{
            top: coords.top,
            left: coords.left,
            transform: coords.below
              ? 'translate(-50%, 8px)'
              : 'translate(-50%, calc(-100% - 8px))',
          }}
        >
          {content}
          <div
            className={
              coords.below
                ? 'absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900'
                : 'absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900'
            }
            aria-hidden="true"
          />
        </div>,
        document.body
      )}
    </>
  )
}

export default Tooltip
