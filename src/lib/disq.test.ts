import { describe, expect, it } from 'vitest'
import { sanitizeBuoy, sanitizeDisq } from './disq'

describe('sanitizeDisq', () => {
  it('wandelt in Großbuchstaben um', () => {
    expect(sanitizeDisq('g')).toBe('G')
  })

  it('lässt nur erlaubte Codes zu (A–L, X)', () => {
    expect(sanitizeDisq('gz')).toBe('G') // z ist kein gültiger Code
    expect(sanitizeDisq('m')).toBe('') // M gibt es nicht
    expect(sanitizeDisq('9A')).toBe('A') // Ziffern raus
  })

  it('normalisiert mehrere Codes einheitlich auf ", "', () => {
    expect(sanitizeDisq('a, x')).toBe('A, X')
    expect(sanitizeDisq('A B')).toBe('A, B')
  })

  it('trennt auch zusammengeschriebene Codes auf ", "', () => {
    expect(sanitizeDisq('gf')).toBe('G, F')
  })
})

describe('sanitizeBuoy', () => {
  it('behält Punkte-Ziffern', () => {
    expect(sanitizeBuoy('10')).toBe('10')
    expect(sanitizeBuoy('5')).toBe('5')
  })

  it('macht aus einem erlaubten Buchstaben eine Großbuchstaben-Disq-Marke', () => {
    expect(sanitizeBuoy('g')).toBe('G')
  })

  it('verwirft unerlaubte Buchstaben', () => {
    expect(sanitizeBuoy('z')).toBe('')
  })
})
