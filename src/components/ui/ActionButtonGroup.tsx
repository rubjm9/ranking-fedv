import React from 'react'
import { Eye, Edit, Trash2 } from 'lucide-react'

interface ActionButtonGroupProps {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  viewTooltip?: string
  editTooltip?: string
  deleteTooltip?: string
  className?: string
}

const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  onView,
  onEdit,
  onDelete,
  viewTooltip = 'Ver',
  editTooltip = 'Editar',
  deleteTooltip = 'Eliminar',
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {onView && (
        <button
          type="button"
          onClick={onView}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg touch-manipulation text-content-muted transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
          title={viewTooltip}
          aria-label={viewTooltip}
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg touch-manipulation text-content-muted transition-colors duration-200 hover:bg-green-50 hover:text-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-green-950/40 dark:hover:text-green-300"
          title={editTooltip}
          aria-label={editTooltip}
        >
          <Edit className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg touch-manipulation text-content-muted transition-colors duration-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-red-950/40 dark:hover:text-red-300"
          title={deleteTooltip}
          aria-label={deleteTooltip}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export default ActionButtonGroup
