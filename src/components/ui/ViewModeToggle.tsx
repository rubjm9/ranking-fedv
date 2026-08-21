import React from 'react'
import { LayoutList, Table2 } from 'lucide-react'
import type { ViewMode } from '@/hooks/useViewMode'
import { cn } from '@/utils/cn'

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
  className?: string
}

const options: Array<{ mode: ViewMode; label: string; Icon: typeof Table2 }> = [
  { mode: 'cards', label: 'Vista de tarjetas', Icon: LayoutList },
  { mode: 'table', label: 'Vista de tabla', Icon: Table2 },
]

/** Conmuta entre tarjetas y tabla en listados densos. */
const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ value, onChange, className }) => (
  <div className={cn('flex items-center gap-1', className)} role="group" aria-label="Modo de vista">
    {options.map(({ mode, label, Icon }) => (
      <button
        key={mode}
        type="button"
        onClick={() => onChange(mode)}
        aria-label={label}
        aria-pressed={value === mode}
        className={cn(
          'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg touch-manipulation transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          value === mode
            ? 'bg-brand-subtle text-brand-strong'
            : 'text-content-muted hover:bg-surface hover:text-content'
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
    ))}
  </div>
)

export default ViewModeToggle
