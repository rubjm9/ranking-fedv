import { describe, it, expect } from 'vitest'
import {
  formatPoints,
  formatInteger,
  formatCoefficient,
  formatPercent,
  roundPoints,
} from '../rankingCalculations'

/**
 * Los formateadores no tenían cobertura, y son el punto donde se decide que la
 * app hable en convención española. Se afirma explícitamente la coma decimal,
 * porque el fallo que se está corrigiendo era precisamente el punto.
 */
describe('formatPoints', () => {
  it('usa coma decimal y punto de millares', () => {
    expect(formatPoints(1505.3)).toBe('1.505,30')
    expect(formatPoints(289)).toBe('289,00')
  })

  it('rellena siempre a dos decimales', () => {
    expect(formatPoints(19.95)).toBe('19,95')
    expect(formatPoints(75.6)).toBe('75,60')
    expect(formatPoints(0)).toBe('0,00')
  })

  it('respeta los decimales pedidos', () => {
    expect(formatPoints(1000, 1)).toBe('1.000,0')
    expect(formatPoints(1000, 0)).toBe('1.000')
  })

  it('conserva el signo negativo', () => {
    expect(formatPoints(-12.5)).toBe('-12,50')
  })
})

describe('formatInteger', () => {
  it('agrupa millares con punto', () => {
    expect(formatInteger(38129)).toBe('38.129')
  })

  it('redondea antes de formatear', () => {
    expect(formatInteger(1000.6)).toBe('1.001')
    expect(formatInteger(1000.4)).toBe('1.000')
  })
})

describe('formatCoefficient', () => {
  it('usa coma decimal', () => {
    expect(formatCoefficient(1.15)).toBe('1,15')
    expect(formatCoefficient(1)).toBe('1,00')
  })

  it('no agrupa millares, que en un coeficiente sobran', () => {
    expect(formatCoefficient(1234.5)).toBe('1234,50')
  })
})

describe('formatPercent', () => {
  it('da un decimal por omisión y con coma', () => {
    expect(formatPercent(12.44)).toBe('12,4')
    expect(formatPercent(100)).toBe('100,0')
  })
})

describe('roundPoints', () => {
  it('devuelve número, no cadena: se usa en aritmética y en la base de datos', () => {
    expect(roundPoints(0.1 + 0.2)).toBe(0.3)
    expect(typeof roundPoints(1.005)).toBe('number')
  })
})
