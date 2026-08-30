import { describe, it, expect } from 'vitest'
import { GLOSSARY_TERMS } from '../glossary'

describe('GLOSSARY_TERMS', () => {
  it('contiene exactamente 16 términos', () => {
    expect(GLOSSARY_TERMS).toHaveLength(16)
  })

  it('no tiene términos duplicados', () => {
    const terms = GLOSSARY_TERMS.map((entry) => entry.term)
    expect(new Set(terms).size).toBe(terms.length)
  })

  it('cada definición es no vacía', () => {
    for (const { term, definition } of GLOSSARY_TERMS) {
      expect(definition.trim(), `Definición vacía para "${term}"`).not.toBe('')
    }
  })
})
