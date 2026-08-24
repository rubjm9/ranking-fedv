import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Check, X } from 'lucide-react'

interface LocationSuggestion {
  id: string
  name: string
  country: string
  region?: string
}

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  error?: string
  /** Necesario para que el <label> del formulario pueda asociarse al campo. */
  id?: string
}

// Base de datos de ubicaciones comunes para torneos de Ultimate Frisbee en España
const LOCATION_DATABASE: LocationSuggestion[] = [
  // Madrid
  { id: 'madrid', name: 'Madrid', country: 'España', region: 'Madrid' },
  { id: 'madrid-centro', name: 'Madrid Centro', country: 'España', region: 'Madrid' },
  { id: 'madrid-norte', name: 'Madrid Norte', country: 'España', region: 'Madrid' },
  { id: 'madrid-sur', name: 'Madrid Sur', country: 'España', region: 'Madrid' },
  
  // Barcelona
  { id: 'barcelona', name: 'Barcelona', country: 'España', region: 'Cataluña' },
  { id: 'barcelona-centro', name: 'Barcelona Centro', country: 'España', region: 'Cataluña' },
  { id: 'barcelona-playa', name: 'Barcelona Playa', country: 'España', region: 'Cataluña' },
  
  // Valencia
  { id: 'valencia', name: 'Valencia', country: 'España', region: 'Valencia' },
  { id: 'valencia-centro', name: 'Valencia Centro', country: 'España', region: 'Valencia' },
  { id: 'valencia-playa', name: 'Valencia Playa', country: 'España', region: 'Valencia' },
  
  // Sevilla
  { id: 'sevilla', name: 'Sevilla', country: 'España', region: 'Andalucía' },
  { id: 'sevilla-centro', name: 'Sevilla Centro', country: 'España', region: 'Andalucía' },
  
  // Bilbao
  { id: 'bilbao', name: 'Bilbao', country: 'España', region: 'País Vasco' },
  { id: 'bilbao-centro', name: 'Bilbao Centro', country: 'España', region: 'País Vasco' },
  
  // Otras ciudades importantes
  { id: 'zaragoza', name: 'Zaragoza', country: 'España', region: 'Aragón' },
  { id: 'malaga', name: 'Málaga', country: 'España', region: 'Andalucía' },
  { id: 'murcia', name: 'Murcia', country: 'España', region: 'Murcia' },
  { id: 'palma', name: 'Palma de Mallorca', country: 'España', region: 'Baleares' },
  { id: 'las-palmas', name: 'Las Palmas de Gran Canaria', country: 'España', region: 'Canarias' },
  { id: 'santa-cruz', name: 'Santa Cruz de Tenerife', country: 'España', region: 'Canarias' },
  { id: 'valladolid', name: 'Valladolid', country: 'España', region: 'Castilla y León' },
  { id: 'cordoba', name: 'Córdoba', country: 'España', region: 'Andalucía' },
  { id: 'vigo', name: 'Vigo', country: 'España', region: 'Galicia' },
  { id: 'gijon', name: 'Gijón', country: 'España', region: 'Asturias' },
  
  // Instalaciones deportivas específicas
  { id: 'casa-campo', name: 'Casa de Campo, Madrid', country: 'España', region: 'Madrid' },
  { id: 'retiro', name: 'Parque del Retiro, Madrid', country: 'España', region: 'Madrid' },
  { id: 'montjuic', name: 'Montjuïc, Barcelona', country: 'España', region: 'Cataluña' },
  { id: 'ciudad-artes', name: 'Ciudad de las Artes, Valencia', country: 'España', region: 'Valencia' },
  { id: 'maria-luisa', name: 'Parque María Luisa, Sevilla', country: 'España', region: 'Andalucía' },
  
  // Playas populares
  { id: 'barceloneta', name: 'Barceloneta, Barcelona', country: 'España', region: 'Cataluña' },
  { id: 'malvarrosa', name: 'Playa de la Malvarrosa, Valencia', country: 'España', region: 'Valencia' },
  { id: 'san-sebastian', name: 'San Sebastián', country: 'España', region: 'País Vasco' },
  { id: 'sitges', name: 'Sitges, Barcelona', country: 'España', region: 'Cataluña' },
  { id: 'cadiz', name: 'Cádiz', country: 'España', region: 'Andalucía' },
  
  // Instalaciones indoor
  { id: 'wizink', name: 'WiZink Center, Madrid', country: 'España', region: 'Madrid' },
  { id: 'palau-sant-jordi', name: 'Palau Sant Jordi, Barcelona', country: 'España', region: 'Cataluña' },
  { id: 'pabellon-fuente', name: 'Pabellón Fuente de San Luis, Valencia', country: 'España', region: 'Valencia' },
]

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Ej: Madrid, España",
  className = "",
  error,
  id
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Filtrar sugerencias basadas en el input
  useEffect(() => {
    if (value.trim() === '') {
      setSuggestions([])
      return
    }

    const filtered = LOCATION_DATABASE.filter(location =>
      location.name.toLowerCase().includes(value.toLowerCase()) ||
      location.region?.toLowerCase().includes(value.toLowerCase()) ||
      location.country.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 8) // Limitar a 8 sugerencias

    setSuggestions(filtered)
    setSelectedIndex(-1)
  }, [value])

  // Manejar selección de sugerencia
  const handleSelect = (suggestion: LocationSuggestion) => {
    onChange(suggestion.name)
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  // Manejar teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Manejar clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node) &&
          listRef.current && !listRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Scroll automático para la sugerencia seleccionada
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-content-subtle" />
        </div>
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen && suggestions.length > 0}
          aria-controls={id ? `${id}-listbox` : undefined}
          aria-activedescendant={
            selectedIndex >= 0 && id ? `${id}-opcion-${selectedIndex}` : undefined
          }
          aria-autocomplete="list"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 shadow-sm ${
            error ? 'border-red-300 bg-red-50 dark:bg-red-950/40' : 'border-line-strong hover:border-gray-400'
          } ${className}`}
          placeholder={placeholder}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Borrar ubicación"
            className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center touch-manipulation text-content-subtle hover:text-content focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Lista de sugerencias */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={listRef}
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-surface border border-line rounded-xl shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              id={id ? `${id}-opcion-${index}` : undefined}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(suggestion)}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-500'
                  : 'hover:bg-surface-muted'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-content-subtle" />
                  <div>
                    <div className="font-medium text-content">
                      {suggestion.name}
                    </div>
                    <div className="text-sm text-content-subtle">
                      {suggestion.region && `${suggestion.region}, `}
                      {suggestion.country}
                    </div>
                  </div>
                </div>
                {index === selectedIndex && (
                  <Check className="h-4 w-4 text-blue-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sugerencias rápidas cuando no hay input */}
      {isOpen && value.trim() === '' && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-surface border border-line rounded-xl shadow-lg"
        >
          <div className="px-4 py-2 text-sm font-medium text-content-subtle border-b border-line">
            Ubicaciones populares
          </div>
          {LOCATION_DATABASE.slice(0, 6).map((suggestion) => (
            <div
              key={suggestion.id}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-3 cursor-pointer hover:bg-surface-muted transition-colors"
            >
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-content-subtle" />
                <div>
                  <div className="font-medium text-content">
                    {suggestion.name}
                  </div>
                  <div className="text-sm text-content-subtle">
                    {suggestion.region && `${suggestion.region}, `}
                    {suggestion.country}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-300">{error}</p>
      )}
    </div>
  )
}

export default LocationAutocomplete

