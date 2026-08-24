import React, { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { AlertCircle, CheckCircle, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface PastePositionsModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (positions: string[]) => void
  teams: Array<{ id: string; name: string }>
}

const PastePositionsModal: React.FC<PastePositionsModalProps> = ({
  isOpen,
  onClose,
  onApply,
  teams
}) => {
  const [pastedText, setPastedText] = useState('')
  const [parsedPositions, setParsedPositions] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Crear mapa de nombres de equipos para validación
  const teamNames = new Set(teams.map(team => team.name.toLowerCase()))

  const parseTextToPositions = (text: string): string[] => {
    // Dividir por líneas y limpiar
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    return lines
  }

  const validatePositions = (positions: string[]): string[] => {
    const errors: string[] = []
    const foundTeams = new Set<string>()

    positions.forEach((teamName, index) => {
      const position = index + 1
      
      // Verificar si el equipo existe
      if (!teamNames.has(teamName.toLowerCase())) {
        errors.push(`Posición ${position}: Equipo "${teamName}" no encontrado en la base de datos`)
      }
      
      // Verificar duplicados
      if (foundTeams.has(teamName.toLowerCase())) {
        errors.push(`Posición ${position}: Equipo "${teamName}" ya está en la lista`)
      } else {
        foundTeams.add(teamName.toLowerCase())
      }
    })

    return errors
  }

  const handleTextChange = (text: string) => {
    setPastedText(text)
    const positions = parseTextToPositions(text)
    setParsedPositions(positions)
    
    if (positions.length > 0) {
      const errors = validatePositions(positions)
      setValidationErrors(errors)
    } else {
      setValidationErrors([])
    }
  }

  const handleApply = () => {
    if (parsedPositions.length === 0) {
      toast.error('No hay posiciones para aplicar')
      return
    }

    if (validationErrors.length > 0) {
      toast.error('Corrige los errores antes de aplicar las posiciones')
      return
    }

    onApply(parsedPositions)
    toast.success(`${parsedPositions.length} posiciones aplicadas correctamente`)
    onClose()
  }

  const handleClose = () => {
    setPastedText('')
    setParsedPositions([])
    setValidationErrors([])
    onClose()
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Pegar listado de posiciones"
      size="lg"
      footer={
        <>
          <button
            onClick={handleClose}
            className="btn-outline min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            disabled={parsedPositions.length === 0 || validationErrors.length > 0}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Users className="h-4 w-4" />
            Aplicar {parsedPositions.length > 0 ? `(${parsedPositions.length} posiciones)` : ''}
          </button>
        </>
      }
    >
      <div>

          {/* Instructions */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Instrucciones:</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Pega una lista de equipos, uno por línea</li>
              <li>• El orden de las líneas será el orden de las posiciones</li>
              <li>• Los nombres deben coincidir exactamente con los registrados</li>
              <li>• Se validará automáticamente contra la base de datos</li>
            </ul>
          </div>

          {/* Text Area */}
          <div className="mb-4">
            <label htmlFor="positions-text" className="block text-sm font-medium text-content-muted mb-2">
              Listado de equipos (uno por línea):
            </label>
            <textarea
              id="positions-text"
              value={pastedText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Ejemplo:&#10;Sharks&#10;Guayota&#10;Murciélagos&#10;Bravas&#10;PXT"
              className="w-full h-32 px-3 py-2 border border-line-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Preview */}
          {parsedPositions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-content mb-2">
                Vista previa ({parsedPositions.length} posiciones):
              </h4>
              <div className="bg-surface-muted rounded-lg p-3 max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {parsedPositions.map((team, index) => {
                    const position = index + 1
                    const isValid = teamNames.has(team.toLowerCase())
                    const isDuplicate = parsedPositions.slice(0, index).some(t => t.toLowerCase() === team.toLowerCase())
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-center p-1 rounded ${
                          isValid && !isDuplicate ? 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300'
                        }`}
                      >
                        <span className="font-medium mr-2">{position}º</span>
                        <span>{team}</span>
                        {isValid && !isDuplicate ? (
                          <CheckCircle className="h-4 w-4 ml-auto text-green-600 dark:text-green-300" />
                        ) : (
                          <AlertCircle className="h-4 w-4 ml-auto text-red-600 dark:text-red-300" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-4">
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-red-900 dark:text-red-300 mb-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Errores encontrados ({validationErrors.length}):
                </h4>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

      </div>
    </Modal>
  )
}

export default PastePositionsModal
