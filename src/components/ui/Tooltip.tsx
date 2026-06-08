import React, { useId, useState, useRef, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'

interface TooltipProps {
  content: string
  children?: React.ReactNode
  className?: string
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, className = '' }) => {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  const updatePosition = useCallback(() => {
    const el = buttonRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setCoords({
      top: rect.top,
      left: rect.left + rect.width / 2,
    })
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

  return (
    <>
      <div className={`relative inline-flex ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-describedby={visible ? id : undefined}
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}
          onFocus={() => setVisible(true)}
          onBlur={() => setVisible(false)}
        >
          {children ?? <Info className="w-2.5 h-2.5 text-slate-600" aria-hidden="true" />}
          <span className="sr-only">Más información</span>
        </button>
      </div>
      {visible && coords && createPortal(
        <div
          id={id}
          role="tooltip"
          className="fixed w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-lg z-[9999] pointer-events-none"
          style={{
            top: coords.top,
            left: coords.left,
            transform: 'translate(-50%, calc(-100% - 8px))',
          }}
        >
          {content}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"
            aria-hidden="true"
          />
        </div>,
        document.body
      )}
    </>
  )
}

export default Tooltip
