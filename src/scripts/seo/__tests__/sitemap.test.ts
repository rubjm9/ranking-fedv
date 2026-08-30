import { describe, it, expect } from 'vitest'
import { STATIC_PATHS } from '../sitemap'

describe('STATIC_PATHS', () => {
  it('no incluye /disc-golf (página noindex)', () => {
    expect(STATIC_PATHS).not.toContain('/disc-golf')
  })
})
