import { describe, it, expect } from 'vitest'
import {
  escribirParametro,
  leerParametro,
  leerEntero,
  serializarLista,
  deserializarLista,
} from '../useUrlState'

/**
 * Se prueba la parte pura, que es donde estaban los fallos: antes no había en
 * el repo ni un solo `setSearchParams` que conservara los demás parámetros.
 */
describe('escribirParametro', () => {
  it('conserva los demás parámetros al cambiar uno', () => {
    const antes = new URLSearchParams('q=atis&region=canarias&orden=puntos')
    const despues = escribirParametro(antes, 'region', 'centro', '')

    expect(despues.get('region')).toBe('centro')
    expect(despues.get('q')).toBe('atis')
    expect(despues.get('orden')).toBe('puntos')
  })

  it('no muta el objeto de entrada', () => {
    const antes = new URLSearchParams('q=atis')
    escribirParametro(antes, 'q', 'otro', '')

    expect(antes.get('q')).toBe('atis')
  })

  it('borra el parámetro cuando el valor es el de por defecto', () => {
    const antes = new URLSearchParams('orden=name&q=atis')
    const despues = escribirParametro(antes, 'orden', 'name', 'name')

    expect(despues.has('orden')).toBe(false)
    expect(despues.get('q')).toBe('atis')
  })

  it('borra el parámetro cuando el valor queda vacío', () => {
    const antes = new URLSearchParams('q=atis&region=centro')
    const despues = escribirParametro(antes, 'q', '', '')

    expect(despues.has('q')).toBe(false)
    expect(despues.get('region')).toBe('centro')
  })

  it('deja la query vacía si solo había el valor por defecto', () => {
    const despues = escribirParametro(new URLSearchParams('pagina=1'), 'pagina', '1', '1')

    expect(despues.toString()).toBe('')
  })

  it('codifica los valores con caracteres especiales', () => {
    const despues = escribirParametro(new URLSearchParams(), 'q', 'Bárbaros y Vikingas', '')

    expect(despues.get('q')).toBe('Bárbaros y Vikingas')
    expect(despues.toString()).not.toContain(' ')
  })
})

describe('leerParametro', () => {
  it('devuelve el valor de la URL cuando existe', () => {
    expect(leerParametro(new URLSearchParams('orden=puntos'), 'orden', 'name')).toBe('puntos')
  })

  it('cae al valor por defecto cuando falta', () => {
    expect(leerParametro(new URLSearchParams(), 'orden', 'name')).toBe('name')
  })

  it('respeta la cadena vacía explícita en la URL', () => {
    expect(leerParametro(new URLSearchParams('q='), 'q', 'algo')).toBe('')
  })
})

describe('leerEntero', () => {
  it('convierte un entero válido', () => {
    expect(leerEntero(new URLSearchParams('pagina=3'), 'pagina', 1)).toBe(3)
  })

  it('cae al valor por defecto cuando falta', () => {
    expect(leerEntero(new URLSearchParams(), 'pagina', 1)).toBe(1)
  })

  it('cae al valor por defecto ante basura escrita a mano', () => {
    expect(leerEntero(new URLSearchParams('pagina=abc'), 'pagina', 1)).toBe(1)
    expect(leerEntero(new URLSearchParams('pagina='), 'pagina', 1)).toBe(1)
  })
})

describe('serializarLista y deserializarLista', () => {
  it('van y vuelven sin pérdida', () => {
    const ids = ['a1', 'b2', 'c3']
    expect(deserializarLista(serializarLista(ids))).toEqual(ids)
  })

  it('descarta los huecos vacíos', () => {
    expect(deserializarLista('a1,,b2,')).toEqual(['a1', 'b2'])
    expect(serializarLista(['a1', '', 'b2'])).toBe('a1,b2')
  })

  it('trata null y la cadena vacía como lista vacía', () => {
    expect(deserializarLista(null)).toEqual([])
    expect(deserializarLista('')).toEqual([])
    expect(serializarLista([])).toBe('')
  })
})
