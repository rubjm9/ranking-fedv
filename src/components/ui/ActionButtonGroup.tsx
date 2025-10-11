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
          onClick={onView}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          title={viewTooltip}
        >
          <Eye className="h-4 w-4" />
        </button>
      )}
      
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
          title={editTooltip}
        >
          <Edit className="h-4 w-4" />
        </button>
      )}
      
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          title={deleteTooltip}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export default ActionButtonGroup
