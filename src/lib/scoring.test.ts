import { describe, expect, it } from 'vitest'
import { getSheetDef } from '../config/active'
import { cellKey, scoreRow } from './scoring'

function getter(values: Record<string, string>) {
  return (key: string) => values[key] ?? ''
}

describe('scoreRow – Tor-Liste (Bojen)', () => {
  const def = getSheetDef('gate135')

  it('summiert direkt eingegebene Bojen-Punkte (5, 10, 15)', () => {
    const nr = '301'
    const values = {
      [cellKey(nr, 'start', 0)]: '5',
      [cellKey(nr, 't1a', 0)]: '10',
      [cellKey(nr, 'ziel', 0)]: '5',
    }
    const r = scoreRow(def, nr, getter(values))
    expect(r.sum).toBe(20)
    expect(r.computedCols).toEqual({})
  })

  it('erkennt Disqualifikations-Buchstaben in einer Tor-Zelle', () => {
    const nr = '302'
    const values = {
      [cellKey(nr, 't3a', 1)]: 'G', // Disq an Tor 3 H H
      [cellKey(nr, 'start', 0)]: '5',
    }
    const r = scoreRow(def, nr, getter(values))
    expect(r.sum).toBe(5)
    expect(r.disqs).toHaveLength(1)
    expect(r.disqs[0].code).toBe('G')
    expect(r.disqs[0].where).toContain('Tor 3')
  })
})

describe('scoreRow – Mann-über-Bord (Fehlercodes → Punkte)', () => {
  const def = getSheetDef('mueb')

  it('mappt Codes auf Punkte und füllt Fehlerpunkte + Σ', () => {
    const nr = '401'
    const values = { [cellKey(nr, 'fehler')]: '13, 17' } // 5 + 5
    const r = scoreRow(def, nr, getter(values))
    expect(r.sum).toBe(10)
    expect(r.computedCols['fp']).toBe(10)
  })

  it('nimmt den Disq-Buchstaben aus der Disq-Spalte auf', () => {
    const nr = '402'
    const values = { [cellKey(nr, 'disq')]: 'F' }
    const r = scoreRow(def, nr, getter(values))
    expect(r.disqs[0].code).toBe('F')
  })
})

describe('scoreRow – Steg (zwei Fehlergruppen, unterschiedliche Gewichte)', () => {
  const def = getSheetDef('steg')

  it('rechnet AB und AN getrennt in ihre Punkte-Spalten', () => {
    const nr = '303'
    const values = {
      [cellKey(nr, 'fehlerAB')]: '3', // 5
      [cellKey(nr, 'fehlerAN')]: '9, 12', // 10 + 10
    }
    const r = scoreRow(def, nr, getter(values))
    expect(r.computedCols['fpab']).toBe(5)
    expect(r.computedCols['fpan']).toBe(20)
  })
})

describe('scoreRow – Tor 5 (Code 1 = 20 Punkte)', () => {
  it('mappt Code 1 auf 20', () => {
    const def = getSheetDef('tor5')
    const nr = '305'
    const r = scoreRow(def, nr, getter({ [cellKey(nr, 'fehler')]: '1' }))
    expect(r.sum).toBe(20)
    expect(r.computedCols['sum']).toBe(20)
  })
})
