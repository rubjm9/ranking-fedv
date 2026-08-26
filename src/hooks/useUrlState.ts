import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebounce } from './useDebounce'

/**
 * Filtros en la URL, para que una vista se pueda compartir y sobreviva al
 * botón atrás.
 *
 * Dos decisiones que conviene entender antes de tocar esto:
 *
 * 1. **La URL es la única fuente de verdad.** No hay `useState` espejo. El
 *    patrón espejo ya causaba un fallo observable en TeamDetailPage: la URL
 *    cambiaba al pulsar atrás y la pestaña visible no. Derivando, el botón
 *    atrás funciona sin escribir nada.
 *
 * 2. **Se escribe con `replace`, no con `push`.** Parece del revés, y es lo
 *    importante en móvil: con `push`, doce ajustes de filtro dejan doce
 *    entradas de historial y el botón atrás deja de servir para salir de la
 *    página. El filtro no necesita sobrevivir a cada cambio intermedio, sino
 *    a irse y volver — y esa entrada la crea ya el enlace al detalle.
 *
 * Además, el valor por defecto no aparece en la URL, así que `/equipos` sigue
 * siendo `/equipos` y solo se ensucia con lo que el usuario cambió de verdad.
 */

/**
 * Escribe una clave conservando el resto de parámetros.
 *
 * Antes no existía en el repo ni un solo `setSearchParams` que preservara: los
 * tres puntos de escritura pasaban un objeto literal y machacaban la query
 * entera.
 */
export function escribirParametro(
  actuales: URLSearchParams,
  clave: string,
  valor: string,
  porDefecto: string
): URLSearchParams {
  const params = new URLSearchParams(actuales)
  if (valor === porDefecto || valor === '') {
    params.delete(clave)
  } else {
    params.set(clave, valor)
  }
  return params
}

export function leerParametro(
  params: URLSearchParams,
  clave: string,
  porDefecto: string
): string {
  return params.get(clave) ?? porDefecto
}

/** Las listas viajan separadas por comas; los vacíos se descartan. */
export function serializarLista(valores: string[]): string {
  return valores.filter(Boolean).join(',')
}

export function deserializarLista(valor: string | null): string[] {
  if (!valor) return []
  return valor.split(',').filter(Boolean)
}

/**
 * Convierte a entero descartando lo que no lo sea, para que un `?pagina=abc`
 * escrito a mano no rompa la vista.
 */
export function leerEntero(
  params: URLSearchParams,
  clave: string,
  porDefecto: number
): number {
  const bruto = params.get(clave)
  if (bruto === null) return porDefecto
  const n = Number.parseInt(bruto, 10)
  return Number.isFinite(n) ? n : porDefecto
}

export function useUrlState<T extends string>(
  clave: string,
  porDefecto: T
): [T, (siguiente: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const valor = leerParametro(searchParams, clave, porDefecto) as T

  const asignar = useCallback(
    (siguiente: T) => {
      setSearchParams(prev => escribirParametro(prev, clave, siguiente, porDefecto), {
        replace: true,
      })
    },
    [clave, porDefecto, setSearchParams]
  )

  return [valor, asignar]
}

export function useUrlNumberState(
  clave: string,
  porDefecto: number
): [number, (siguiente: number) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const valor = leerEntero(searchParams, clave, porDefecto)

  const asignar = useCallback(
    (siguiente: number) => {
      setSearchParams(
        prev => escribirParametro(prev, clave, String(siguiente), String(porDefecto)),
        { replace: true }
      )
    },
    [clave, porDefecto, setSearchParams]
  )

  return [valor, asignar]
}

export function useUrlListState(
  clave: string
): [string[], (siguiente: string[]) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const bruto = searchParams.get(clave) ?? ''

  // Memoizado sobre la cadena: sin esto, cada render devolvería un array nuevo
  // y invalidaría los `useMemo` que dependan de él.
  const valor = useMemo(() => deserializarLista(bruto), [bruto])

  const asignar = useCallback(
    (siguiente: string[]) => {
      setSearchParams(prev => escribirParametro(prev, clave, serializarLista(siguiente), ''), {
        replace: true,
      })
    },
    [clave, setSearchParams]
  )

  return [valor, asignar]
}

/**
 * Escribe varias claves de una vez.
 *
 * Hace falta porque `setSearchParams` de react-router aplica la función sobre
 * el `searchParams` cerrado en el render, no sobre una cola de reducers: dos
 * llamadas seguidas en el mismo handler parten de la misma base y la última
 * gana, perdiendo silenciosamente la primera. Cualquier acción que toque más
 * de un parámetro —ordenar, que cambia campo y dirección, o limpiar filtros,
 * que toca seis— tiene que pasar por aquí.
 *
 * Un valor `null` borra la clave.
 */
export function useUrlBatch(): (cambios: Record<string, string | null>) => void {
  const [, setSearchParams] = useSearchParams()

  return useCallback(
    (cambios: Record<string, string | null>) => {
      setSearchParams(
        prev => {
          const params = new URLSearchParams(prev)
          for (const [clave, valor] of Object.entries(cambios)) {
            if (valor === null || valor === '') params.delete(clave)
            else params.set(clave, valor)
          }
          return params
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )
}

/**
 * Búsqueda con debounce. Devuelve el valor inmediato (para el `<input>`, que
 * debe responder al instante), el setter, y el valor ya asentado en la URL
 * (para el `queryKey`).
 *
 * Escribir por pulsación dejaría una entrada de historial por tecla, así que
 * a la URL solo llega el valor diferido.
 */
export function useUrlDebouncedState(
  clave: string,
  porDefecto = '',
  retardo = 300
): [string, (siguiente: string) => void, string] {
  const [searchParams, setSearchParams] = useSearchParams()
  const enUrl = leerParametro(searchParams, clave, porDefecto)

  const [valor, setValor] = useState(enUrl)
  const diferido = useDebounce(valor, retardo)
  const ultimoSincronizado = useRef(enUrl)

  useEffect(() => {
    if (diferido === ultimoSincronizado.current) return
    ultimoSincronizado.current = diferido
    setSearchParams(prev => escribirParametro(prev, clave, diferido, porDefecto), {
      replace: true,
    })
  }, [diferido, clave, porDefecto, setSearchParams])

  // Al pulsar atrás el parámetro cambia por fuera y hay que resembrar el input.
  useEffect(() => {
    if (enUrl === ultimoSincronizado.current) return
    ultimoSincronizado.current = enUrl
    setValor(enUrl)
  }, [enUrl])

  return [valor, setValor, enUrl]
}
