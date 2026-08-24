import React from 'react'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import Modal from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  children: React.ReactNode
  confirmLabel?: string
  pendingLabel?: string
  isPending?: boolean
  /** `danger` para acciones destructivas; `warning` para las reversibles. */
  tone?: 'danger' | 'warning'
}

const TONES = {
  danger: {
    Icon: Trash2,
    wrap: 'bg-red-100 dark:bg-red-950/50',
    icon: 'text-red-600 dark:text-red-300',
    button:
      'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
  },
  warning: {
    Icon: AlertTriangle,
    wrap: 'bg-amber-100 dark:bg-amber-950/50',
    icon: 'text-amber-600 dark:text-amber-300',
    button:
      'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500',
  },
}

/**
 * Diálogo de confirmación para acciones destructivas.
 *
 * Unifica las cuatro copias que había en el panel, todas con `w-96` fijo y sin
 * margen lateral: en un viewport de 390px el panel llegaba a los bordes.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = 'Eliminar',
  pendingLabel = 'Eliminando...',
  isPending = false,
  tone = 'danger',
}) => {
  const { Icon, wrap, icon, button } = TONES[tone]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-outline min-h-[44px]">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 ${button}`}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-center">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${wrap}`}
          aria-hidden="true"
        >
          <Icon className={`h-6 w-6 ${icon}`} />
        </div>
        <div className="mt-4 text-sm text-content-muted">{children}</div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
