import { afterAll, describe, expect, it } from 'vitest'
import { applyBeschriftung, getBeschriftungen, getSheetDef } from './active'

/** Alle Unter-Spalten-Beschriftungen einer Position als ein String. */
function subText(id: string): string {
  return getSheetDef(id)
    .columns.flatMap((c) => c.sub ?? [])
    .join(' ')
}

/** Unter-Spalten einer bestimmten Spalte. */
function colSub(posId: string, key: string): string[] | undefined {
  return getSheetDef(posId).columns.find((c) => c.key === key)?.sub
}

describe('Bezeichnungs-Schemata (live umschaltbar)', () => {
  afterAll(() => applyBeschriftung('rl')) // Standard für andere Tests wiederherstellen

  it('liefert die konfigurierten Schemata', () => {
    expect(getBeschriftungen().map((b) => b.id)).toEqual(['rl', 'ls', 'sl', 'kh', 'ia'])
  })

  it('Standard Rechts/Links: Tor-Spalten tragen R und L', () => {
    applyBeschriftung('rl')
    const t = subText('gate135')
    expect(t).toMatch(/\bR\b/)
    expect(t).toMatch(/\bL\b/)
  })

  it('Umschalten auf Land/See beschriftet die Bojen-Seiten neu (L/S)', () => {
    applyBeschriftung('ls')
    const t = subText('gate135')
    expect(t).toMatch(/\bL\b/)
    expect(t).toMatch(/\bS\b/)
    expect(t).not.toMatch(/\bR\b/) // kein Rechts-Kürzel mehr
  })

  it('Umschalten auf Kai/Hafen (K/H) - K erscheint, S verschwindet', () => {
    applyBeschriftung('kh')
    const t = subText('gate135')
    expect(t).toMatch(/\bK\b/)
    expect(t).not.toMatch(/\bS\b/)
  })

  it('Innen/Außen ist tor-relativ: Tor 1/3 Innen-Außen, Tor 2/4 Außen-Innen', () => {
    applyBeschriftung('ia')
    // Alcatraz: Spaltenreihenfolge seiteA, seiteB
    expect(colSub('gate135', 't1a')).toEqual(['H I', 'H A']) // Tor 1: Innen, Außen
    expect(colSub('gate135', 't3b')).toEqual(['Z I', 'Z A']) // Tor 3 Rückfahrt
    expect(colSub('gate245', 't2a')).toEqual(['H A', 'H I']) // Tor 2: Außen, Innen
    // Tor 5, Start, Ziel bleiben physisch (Rechts/Links)
    expect(colSub('gate135', 't5')).toEqual(['H R', 'Z R'])
    expect(colSub('gate135', 'start')).toEqual(['H R'])
  })

  it('Legendenhinweis erklärt I/A nur im Innen/Außen-Schema (ohne Leerzeilen)', () => {
    applyBeschriftung('rl')
    expect(getSheetDef('gate135').legendNote ?? '').not.toContain('Innen')
    applyBeschriftung('ia')
    const note = getSheetDef('gate135').legendNote ?? ''
    expect(note).toContain('I = Innen')
    expect(note).toContain('A = Außen')
    expect(note.split('\n').some((l) => l.trim() === '')).toBe(false) // keine Leerzeilen
  })
})
