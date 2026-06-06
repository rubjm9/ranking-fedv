import React, { useId, useState } from 'react'
import { Info } from 'lucide-react'

interface TooltipProps {
  content: string
  children?: React.ReactNode
  className?: string
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, className = '' }) => {
  const id = useId()
  const [visible, setVisible] = useState(false)

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
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
      {visible && (
        <div
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-lg z-[100]"
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}

export default Tooltip
