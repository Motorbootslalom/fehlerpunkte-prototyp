import type { CellKind, Column, DisqDef, SheetDef } from '../types'
import type { RawConfig, RawPosition, RawSpalte } from './schema'

// Wandelt die geparste (zusammengeführte) YAML-Konfiguration in die interne
// Darstellung um. Positionen binden Fehler-Kataloge und Hinweise per Verweis ein.

export interface ResolvedConfig {
  positions: SheetDef[]
  /** Reihenfolge der Positionen (IDs). */
  order: string[]
  /** Reihenfolge für „eine Klasse · alle Positionen“. */
  klassenOrder: string[]
  /** Alle konfigurierten Disqualifikationen. */
  allDisqs: DisqDef[]
}

const TYP_TO_KIND: Record<RawSpalte['typ'], CellKind> = {
  boje: 'buoy',
  code: 'code',
  punkte: 'points',
  zeit: 'time',
  disq: 'disq',
  text: 'text',
  summe: 'sum',
}

function toColumn(sp: RawSpalte): Column {
  return {
    key: sp.key,
    label: sp.label,
    kind: TYP_TO_KIND[sp.typ],
    sub: sp.sub,
    pointsCol: sp.punkteSpalte,
    grow: sp.breite,
  }
}

function resolveDisq(pos: RawPosition, all: DisqDef[]): DisqDef[] | undefined {
  if (!pos.disq || pos.disq === 'keine') return undefined
  if (pos.disq === 'alle') return all
  const set = new Set(pos.disq.map((c) => String(c)))
  return all.filter((d) => set.has(d.code))
}

export function buildConfig(raw: RawConfig): ResolvedConfig {
  const allDisqs: DisqDef[] = (raw.disqualifikationen ?? []).map((d) => ({
    code: String(d.code),
    text: d.text,
  }))
  const kataloge = raw.kataloge ?? {}
  const hinweise = raw.hinweise ?? {}

  const positions: SheetDef[] = (raw.positionen ?? []).map((pos) => {
    const disqTable = resolveDisq(pos, allDisqs)
    const kat = pos.katalog ? kataloge[pos.katalog] : undefined
    // Hinweis per Verweis (ID), sonst direkt als Text.
    const legendNote = pos.hinweis ? (hinweise[pos.hinweis] ?? pos.hinweis) : undefined
    return {
      typeId: pos.id,
      title: pos.titel,
      menuLabel: pos.menue ?? pos.titel,
      orientation: pos.ausrichtung === 'quer' ? 'landscape' : 'portrait',
      columns: pos.spalten.map(toColumn),
      sumColumnKey: pos.summeSpalte,
      errorTable: kat?.fehler.map((f) => ({ code: String(f.code), text: f.text, punkte: f.punkte })),
      errorTableTitle: kat?.titel,
      disqTable,
      showDisqTable: !!disqTable && disqTable.length > 0,
      legendNote,
      courseImageDir: pos.bild,
      bildDrehung: pos.bildDrehung,
    }
  })

  const order = positions.map((p) => p.typeId)
  const klassenOrder =
    raw.klassenReihenfolge && raw.klassenReihenfolge.length > 0 ? raw.klassenReihenfolge : order

  return { positions, order, klassenOrder, allDisqs }
}
