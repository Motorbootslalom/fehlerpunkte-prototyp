import { describe, expect, it } from 'vitest'
import { formatCodes } from './codes'

describe('formatCodes', () => {
  it('sortiert numerisch und trennt mit ", "', () => {
    expect(formatCodes('12 9')).toBe('9, 12')
    expect(formatCodes('5,3,4')).toBe('3, 4, 5')
  })

  it('akzeptiert gemischte Trenner', () => {
    expect(formatCodes('9; 12 / 3')).toBe('3, 9, 12')
  })

  it('behält Mehrfachnennungen', () => {
    expect(formatCodes('9 9 3')).toBe('3, 9, 9')
  })

  it('verwirft Nicht-Ziffern und leert sauber', () => {
    expect(formatCodes('a, 5, x')).toBe('5')
    expect(formatCodes('')).toBe('')
  })
})
