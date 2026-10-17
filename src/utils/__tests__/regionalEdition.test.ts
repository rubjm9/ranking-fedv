import { describe, expect, it } from 'vitest'
import { getRegionalEditionLabel } from '../rankingCalculations'

describe('getRegionalEditionLabel', () => {
  it('nombra la edición siguiente a la temporada de cálculo', () => {
    expect(getRegionalEditionLabel('2024-25')).toBe('Regionales 2025-26')
  })

  it('cruza correctamente el cambio de década', () => {
    expect(getRegionalEditionLabel('2029-30')).toBe('Regionales 2030-31')
  })
})
