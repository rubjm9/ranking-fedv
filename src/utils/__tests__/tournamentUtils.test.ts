import { describe, it, expect } from 'vitest'
import {
  nationalCurvePoints,
  regionalCurvePoints,
  getPointsForPosition,
  generateDefaultPositions
} from '../tournamentUtils'

describe('nationalCurvePoints (85% puestos 1-8, 90% resto, ancla 1000)', () => {
  it('respeta el tramo del 85% en el top 8', () => {
    expect(nationalCurvePoints(1)).toBe(1000)
    expect(nationalCurvePoints(2)).toBe(850)
    expect(nationalCurvePoints(8)).toBe(321)
  })

  it('cambia al 90% a partir del puesto 9', () => {
    expect(nationalCurvePoints(9)).toBe(289)
    expect(nationalCurvePoints(10)).toBe(260)
    expect(nationalCurvePoints(16)).toBe(138)
  })

  it('extiende la curva a la 2ª división (puestos 17-32)', () => {
    expect(nationalCurvePoints(17)).toBe(124)
    expect(nationalCurvePoints(32)).toBe(26)
  })

  it('devuelve 0 para posiciones inválidas', () => {
    expect(nationalCurvePoints(0)).toBe(0)
    expect(nationalCurvePoints(-1)).toBe(0)
  })
})

describe('regionalCurvePoints (mismo decaimiento, ancla 100)', () => {
  it('aplica el tramo del 85% en el top 8', () => {
    expect(regionalCurvePoints(1)).toBe(100)
    expect(regionalCurvePoints(2)).toBe(85)
    expect(regionalCurvePoints(8)).toBe(32)
  })

  it('cambia al 90% a partir del puesto 9', () => {
    expect(regionalCurvePoints(9)).toBe(29)
  })
})

describe('getPointsForPosition', () => {
  it('CE1 usa la curva nacional directa (offset 0)', () => {
    expect(getPointsForPosition(1, 'CE1')).toBe(1000)
    expect(getPointsForPosition(16, 'CE1')).toBe(138)
  })

  it('CE2 continúa la curva nacional tras el offset', () => {
    // 1ª de 16 equipos -> el campeón de 2ª es el puesto 17 de la curva
    expect(getPointsForPosition(1, 'CE2', 16)).toBe(124)
    expect(getPointsForPosition(16, 'CE2', 16)).toBe(26)
  })

  it('REGIONAL usa la curva regional', () => {
    expect(getPointsForPosition(1, 'REGIONAL')).toBe(100)
    expect(getPointsForPosition(8, 'REGIONAL')).toBe(32)
  })

  it('tipo desconocido devuelve 0', () => {
    expect(getPointsForPosition(1, 'OTRO')).toBe(0)
  })
})

describe('generateDefaultPositions', () => {
  it('genera 3 filas con puntos según offset', () => {
    const ce2 = generateDefaultPositions('CE2', 16)
    expect(ce2).toHaveLength(3)
    expect(ce2[0]).toEqual({ position: 1, teamId: '', points: 124 })
  })
})
