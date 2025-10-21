import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

interface Team {
  id: string
  name: string
  region?: {
    name: string
  }
}

interface TeamSelectorProps {
  teams: Team[]
  value: string
  onChange: (teamId: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  teams,
  value,
  onChange,
  placeholder = 'Seleccionar equipo',
  disabled = false,
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredTeams, setFilteredTeams] = useState<Team[]>(teams)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedTeam = teams.find(team => team.id === value)

  useEffect(() => {
    const filtered = teams.filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.region?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredTeams(filtered)
    setSelectedIndex(0) // Resetear el índice seleccionado cuando cambie el filtro
  }, [teams, searchTerm])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(0)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-focus en el input de búsqueda cuando se abre el desplegable
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Pequeño delay para asegurar que el DOM se haya actualizado
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 0)
    }
  }, [isOpen])

  const handleSelect = (team: Team) => {
    onChange(team.id)
    setIsOpen(false)
    setSearchTerm('')
    setSelectedIndex(0)
  }

  const handleClear = () => {
    onChange('')
    setSearchTerm('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault()
      if (filteredTeams.length > 0) {
        handleSelect(filteredTeams[selectedIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < filteredTeams.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : filteredTeams.length - 1
      )
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`relative cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div
          className={`flex items-center justify-between w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100' : 'bg-white'}`}
        >
          <div className="flex items-center flex-1 min-w-0">
            {selectedTeam ? (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {selectedTeam.name}
                </div>
                {selectedTeam.region && (
                  <div className="text-xs text-gray-500 truncate">
                    {selectedTeam.region.name}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          
          <div className="flex items-center ml-2">
            {selectedTeam && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
                className="p-1 text-gray-400 hover:text-gray-600 mr-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar equipo..."
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {filteredTeams.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No se encontraron equipos
              </div>
            ) : (
              filteredTeams.map((team, index) => (
                <div
                  key={team.id}
                  className={`px-3 py-2 cursor-pointer transition-colors ${
                    index === selectedIndex 
                      ? 'bg-blue-100 text-blue-900' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleSelect(team)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className={`text-sm font-medium ${
                    index === selectedIndex ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {team.name}
                  </div>
                  {team.region && (
                    <div className={`text-xs ${
                      index === selectedIndex ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      {team.region.name}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamSelector
