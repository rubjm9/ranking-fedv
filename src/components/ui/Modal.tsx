import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  /** Oculta el título visualmente, manteniéndolo como nombre accesible. */
  hideTitle?: boolean
  description?: string
  size?: ModalSize
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

const SIZES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

/**
 * Diálogo modal accesible.
 *
 * Sustituye a los overlays `fixed inset-0` que había repartidos por el panel:
 * ninguno se cerraba con Escape, ninguno bloqueaba el scroll del fondo, ninguno
 * declaraba `role="dialog"` y la mayoría no tenía margen lateral, así que en
 * móvil el panel tocaba los bordes de la pantalla.
 *
 * Se apoya en `<dialog>` nativo, que aporta el rol, el foco inicial, el ciclo
 * de tabulación contenido y el cierre con Escape sin código propio.
 */
const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  hideTitle = false,
  description,
  size = 'md',
  footer,
  children,
  className,
}) => {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    // Escape dispara `cancel`; se delega el cierre al estado del consumidor.
    const onCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }
    dialog.addEventListener('cancel', onCancel)
    return () => dialog.removeEventListener('cancel', onCancel)
  }, [onClose])

  // `<dialog>` no bloquea el scroll del fondo en todos los navegadores.
  useEffect(() => {
    if (!open) return
    const { body } = document
    const previo = body.style.overflow
    body.style.overflow = 'hidden'
    return () => {
      body.style.overflow = previo
    }
  }, [open])

  const contenido = (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
      onClick={(e) => {
        // Clic en el backdrop (el propio <dialog> fuera del panel) cierra.
        if (e.target === ref.current) onClose()
      }}
      className={cn(
        'w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-0 text-content shadow-xl',
        'backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm',
        'max-h-[calc(100dvh-2rem)] overflow-hidden',
        SIZES[size],
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2
            id="modal-title"
            className={cn('font-display text-lg font-semibold text-content', hideTitle && 'sr-only')}
          >
            {title}
          </h2>
          {description && (
            <p id="modal-description" className="mt-1 text-sm text-content-muted">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="-mr-2 -mt-2 inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg touch-manipulation text-content-muted transition-colors hover:bg-surface-muted hover:text-content focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-h-[60dvh] overflow-y-auto overscroll-contain px-5 py-4">{children}</div>

      {footer && (
        <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
          {footer}
        </div>
      )}
    </dialog>
  )

  return createPortal(contenido, document.body)
}

export default Modal
