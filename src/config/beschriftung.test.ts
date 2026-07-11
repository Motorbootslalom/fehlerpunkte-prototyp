import { afterAll, describe, expect, it } from 'vitest'
import { applyBeschriftung, getBeschriftungen, getSheetDef } from './active'

/** Alle Unter-Spalten-Beschriftungen einer Position als ein String. */
function subText(id: string): string {
  return getSheetDef(id)
    .columns.flatMap((c) => c.sub ?? [])
    .join(' ')
}

describe('Bezeichnungs-Schemata (live umschaltbar)', () => {
  afterAll(() => applyBeschriftung('rl')) // Standard für andere Tests wiederherstellen

  it('liefert die konfigurierten Schemata', () => {
    expect(getBeschriftungen().map((b) => b.id)).toEqual(['rl', 'ls', 'sl', 'kh'])
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
})
