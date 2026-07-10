import type { CellKind, Column, DisqDef, SheetDef } from '../types'
import type { RawConfig, RawPosition, RawSpalte } from './schema'

// Wandelt die geparste (zusammengeführte) YAML-Konfiguration in die interne
// Darstellung um. Positionen binden Fehler-Kataloge und Hinweise per Verweis ein.

export interface ResolvedAufbau {
  id: string
  name: string
  /** Positions-IDs dieses Aufbaus (nur existierende, in Reihenfolge). */
  order: string[]
}

export interface ResolvedConfig {
  positions: SheetDef[]
  /** Aufbauten (Setups); der erste ist der Standard. */
  aufbauten: ResolvedAufbau[]
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

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Ersetzt ganze Wörter, die in der Token-Map stehen (einmalig, ohne Kaskade). */
function resolveTokens(text: string, tokens: Record<string, string>): string {
  const keys = Object.keys(tokens)
  if (keys.length === 0) return text
  keys.sort((a, b) => b.length - a.length)
  const re = new RegExp(`\\b(${keys.map(escapeRegex).join('|')})\\b`, 'g')
  return text.replace(re, (m) => tokens[m] ?? m)
}

function toColumn(sp: RawSpalte, tokens: Record<string, string>): Column {
  return {
    key: sp.key,
    label: sp.label,
    kind: TYP_TO_KIND[sp.typ],
    sub: sp.sub?.map((x) => resolveTokens(x, tokens)),
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
  const tokens = raw.bezeichnungen ?? {}

  const positions: SheetDef[] = (raw.positionen ?? []).map((pos) => {
    const disqTable = resolveDisq(pos, allDisqs)
    const kat = pos.katalog ? kataloge[pos.katalog] : undefined
    // Hinweis per Verweis (ID), sonst direkt als Text; Tokens einsetzen.
    const noteRaw = pos.hinweis ? (hinweise[pos.hinweis] ?? pos.hinweis) : undefined
    const legendNote = noteRaw ? resolveTokens(noteRaw, tokens) : undefined
    return {
      typeId: pos.id,
      title: pos.titel,
      menuLabel: pos.menue ?? pos.titel,
      orientation: pos.ausrichtung === 'quer' ? 'landscape' : 'portrait',
      columns: pos.spalten.map((sp) => toColumn(sp, tokens)),
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

  const known = new Set(positions.map((p) => p.typeId))
  // Aufbauten: nur existierende Positions-IDs; ohne Definition ein Standard mit allen.
  const aufbauten: ResolvedAufbau[] =
    raw.aufbauten && raw.aufbauten.length > 0
      ? raw.aufbauten.map((a) => ({
          id: a.id,
          name: a.name,
          order: a.positionen.filter((id) => known.has(id)),
        }))
      : [{ id: 'standard', name: 'Standard', order: positions.map((p) => p.typeId) }]

  return { positions, aufbauten, allDisqs }
}
