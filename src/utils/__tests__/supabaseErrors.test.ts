import { describe, expect, it } from 'vitest'
import { isMissingColumnError } from '../supabaseErrors'

describe('isMissingColumnError', () => {
  it('detecta el código Postgres 42703', () => {
    expect(isMissingColumnError({ code: '42703', message: 'column regions.slug does not exist' }, 'slug')).toBe(true)
  })

  it('detecta el mensaje de columna ausente', () => {
    expect(
      isMissingColumnError({ message: 'column regions.slug does not exist' }, 'slug')
    ).toBe(true)
  })

  it('rechaza otros errores', () => {
    expect(isMissingColumnError({ code: 'PGRST116', message: 'not found' }, 'slug')).toBe(false)
    expect(isMissingColumnError(null, 'slug')).toBe(false)
  })
})
