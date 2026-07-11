import { useState } from 'react'
import { getSheetDef } from '../config/active'
import { gridNavKeyDown } from '../lib/gridnav'
import { normalizeCodeCell } from '../lib/codes'
import { allowedSet, sanitizeBuoy, sanitizeCodeInput, sanitizeDisq } from '../lib/disq'
import { cellKey, formatDisqs, scoreRow } from '../lib/scoring'
import { useCell, useStore } from '../state/store'
import type { Bogen, CellKind, Column } from '../types'
import { Legend } from './Legend'
import { SheetHeader } from './SheetHeader'
import { TimeCell } from './TimeCell'

interface Row {
  id: string
  nr: string
  fixed: boolean
  shaded: boolean
}

/** Eine "Blatt"-Spalte = genau eine Zelle je Zeile (Bojen-Unterspalten flach). */
interface Leaf {
  colKey: string
  subIndex?: number
  kind: CellKind
  label: string
  grow?: number
  /** Nur 'code': erlaubte Codes dieser Spalte (eigener Katalog), sonst undefined. */
  codes?: Set<string>
}

function toLeaves(columns: Column[]): Leaf[] {
  return columns.flatMap((col) => {
    const codes =
      col.kind === 'code' && col.errorTable ? new Set(col.errorTable.map((e) => e.code)) : undefined
    return col.sub && col.sub.length > 0
      ? col.sub.map((s, i) => ({
          colKey: col.key,
          subIndex: i,
          kind: col.kind,
          label: `${col.label} ${s}`,
          grow: col.grow,
          codes,
        }))
      : [{ colKey: col.key, kind: col.kind, label: col.label, grow: col.grow, codes }]
  })
}

/**
 * Spaltenbreite fürs <colgroup>. Weil der Kopf als eine über alle Spalten
 * gehende Zelle in <thead> steckt, kann `table-layout: fixed` die Breiten nicht
 * mehr aus der ersten Zeile ableiten - deshalb definieren wir sie hier.
 */
function leafWidth(leaf: Leaf): string | undefined {
  if (leaf.kind === 'sum') return '12mm'
  if (leaf.kind === 'disq') return '16mm'
  if (leaf.grow) return `${leaf.grow * 12}%`
  return undefined // buoy/time/code ohne grow → teilen sich den Rest
}

/** Rendert einen kompletten Bogen als A4-Seite (Eingabe = Druckansicht). */
export function SheetView({ bogen }: { bogen: Bogen }) {
  const { state, dispatch } = useStore()
  const cell = useCell(bogen.id)
  const def = getSheetDef(bogen.typeId)
  const nums = state.numbers[bogen.klasse] ?? []

  // Fadenkreuz: aktuell fokussierte Zeile/Spalte (für die Orientierungs-Hervorhebung).
  const [focus, setFocus] = useState<{ row: number; col: number } | null>(null)

  const rows: Row[] = nums.map((n) => ({ id: String(n), nr: String(n), fixed: true, shaded: false }))
  // Immer genau `emptyRows` leere Zeilen nach den Startnummern (einstellbar).
  for (let i = 0; i < state.emptyRows; i++) {
    rows.push({ id: `_x${i}`, nr: '', fixed: false, shaded: false })
  }
  // Zur Orientierung ist jede 5. Zeile grau hinterlegt.
  rows.forEach((r, i) => {
    r.shaded = (i + 1) % 5 === 0
  })

  const leaves = toLeaves(def.columns)
  const twoRow = def.columns.some((c) => c.sub && c.sub.length > 0)

  const hl = (rowIdx: number, colIdx: number): string => {
    if (!focus) return ''
    return (focus.row === rowIdx ? ' hl-row' : '') + (focus.col === colIdx ? ' hl-col' : '')
  }

  function handleFocus(e: React.FocusEvent<HTMLTableElement>) {
    const t = e.target as HTMLElement
    const td = t.closest('td')
    const tr = t.closest('tr')
    const body = t.closest('tbody')
    if (td && tr && body) {
      setFocus({ row: Array.from(body.rows).indexOf(tr as HTMLTableRowElement), col: td.cellIndex })
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLTableElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(null)
  }

  // Gesamtspaltenzahl (Nr. + alle Blatt-Spalten) für die über die volle Breite
  // gehenden Kopf-/Fußzellen.
  const totalCols = 1 + leaves.length
  // Erlaubte Disq-Codes dieser Position (für Eingabe-Validierung).
  const allowed = allowedSet(def.disqTable)
  // Positionsweite Fehlercodes (Fallback für Spalten ohne eigenen Katalog).
  const defCodes = new Set((def.errorTable ?? []).map((e) => e.code))
  // Bild um ±90° gedreht → Hochformat neben der Legende.
  const drehung = def.bildDrehung ?? 0
  const gedreht = Math.abs(drehung) === 90

  return (
    <div className={`sheet sheet--${def.orientation}${gedreht ? ' sheet--rotated' : ''}`}>
      {/* Der gesamte Bogen ist EINE Tabelle: <thead>/<tfoot> wiederholen sich
          beim Druck automatisch auf jeder Seite, wenn die Liste umbricht. */}
      <table className="sheet-table" onFocusCapture={handleFocus} onBlurCapture={handleBlur}>
        <colgroup>
          <col className="cg-nr" />
          {leaves.map((leaf, i) => (
            <col key={i} style={{ width: leafWidth(leaf) }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="sheet-head-cell" colSpan={totalCols}>
              <SheetHeader
                def={def}
                bogen={bogen}
                eventName={state.eventName}
                wkr={state.wkr[bogen.id] ?? ''}
                onWkr={(name) => dispatch({ type: 'SET_WKR', bogenId: bogen.id, name })}
              />
            </th>
          </tr>
          <tr>
            <th className="col-nr" rowSpan={twoRow ? 2 : 1}>
              Nr.
            </th>
            {def.columns.map((col) => renderHeadTop(col, twoRow))}
          </tr>
          {twoRow && (
            <tr>
              {def.columns.flatMap((col) =>
                col.sub && col.sub.length > 0
                  ? col.sub.map((s, i) => (
                      <th key={`${col.key}-${i}`} className="col-sub">
                        {s}
                      </th>
                    ))
                  : [],
              )}
            </tr>
          )}
        </thead>
        <tfoot>
          <tr>
            <td className="sheet-foot-cell" colSpan={totalCols}>
              <div className="sheet-footer">
                <Legend def={def} />
                {def.courseImageDir && (
                  <div className="course">
                    {gedreht ? (
                      // Um ±90° gedreht und formatfüllend: Inline-SVG mit
                      // preserveAspectRatio füllt die (beliebig hohe) Box proportional.
                      <svg
                        className="course-svg"
                        viewBox="0 0 100 237"
                        preserveAspectRatio="xMidYMid meet"
                      >
                        <image
                          href={`${import.meta.env.BASE_URL}parcours/${def.courseImageDir}/Klasse${bogen.klasse}.svg`}
                          width="237"
                          height="100"
                          transform={
                            drehung === -90 ? 'translate(0 237) rotate(-90)' : 'translate(100 0) rotate(90)'
                          }
                          preserveAspectRatio="xMidYMid meet"
                        />
                      </svg>
                    ) : (
                      <img
                        src={`${import.meta.env.BASE_URL}parcours/${def.courseImageDir}/Klasse${bogen.klasse}.svg`}
                        alt={`Parcours Klasse ${bogen.klasse}`}
                        onError={(e) => {
                          ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    )}
                  </div>
                )}
                <div className="signature">
                  <span className="sig-line" />
                  <span className="sig-label">Unterschrift WKR</span>
                </div>
              </div>
            </td>
          </tr>
        </tfoot>
        <tbody>
          {rows.map((row, rowIdx) => {
            const rowKey = row.fixed ? row.nr : row.id
            const score = scoreRow(def, rowKey, (k) => cell.getByKey(k))
            const disqTitle = score.disqs.length ? formatDisqs(score.disqs) : undefined
            // Disq-Buchstaben aus den Tor-/Bojen-Zellen (nicht aus der Disq-Spalte selbst).
            const autoDisq = Array.from(
              new Set(score.disqs.filter((d) => d.where !== 'Disq.').map((d) => d.code)),
            ).join(', ')

            return (
              <tr key={row.id} className={row.shaded ? 'row-shaded' : undefined}>
                <td className={`col-nr${hl(rowIdx, 0)}`}>
                  {row.fixed ? (
                    row.nr
                  ) : (
                    <input
                      className="cell-input nr-input"
                      value={cell.getByKey(cellKey(row.id, '__nr'))}
                      onChange={(e) => cell.set(cellKey(row.id, '__nr'), e.target.value)}
                      onKeyDown={gridNavKeyDown}
                    />
                  )}
                </td>
                {leaves.map((leaf, li) =>
                  renderLeafCell(
                    leaf,
                    rowKey,
                    cell,
                    score,
                    disqTitle,
                    autoDisq,
                    hl(rowIdx, li + 1),
                    allowed,
                    defCodes,
                  ),
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function renderHeadTop(col: Column, twoRow: boolean) {
  if (col.sub && col.sub.length > 0) {
    return (
      <th key={col.key} className="col-group" colSpan={col.sub.length}>
        {col.label}
      </th>
    )
  }
  return (
    <th key={col.key} className={`col-${col.kind}`} rowSpan={twoRow ? 2 : 1}>
      {col.label}
    </th>
  )
}

function renderLeafCell(
  leaf: Leaf,
  rowKey: string,
  cell: ReturnType<typeof useCell>,
  score: ReturnType<typeof scoreRow>,
  disqTitle: string | undefined,
  autoDisq: string,
  hlCls: string,
  allowed: Set<string>,
  defCodes: Set<string>,
) {
  const ck = cellKey(rowKey, leaf.colKey, leaf.subIndex)
  const key = leaf.subIndex === undefined ? leaf.colKey : `${leaf.colKey}#${leaf.subIndex}`

  if (leaf.kind === 'sum') {
    const val = leaf.colKey in score.computedCols ? score.computedCols[leaf.colKey] : score.sum
    return (
      <td key={key} className={`col-sum-cell${hlCls}`} title={disqTitle}>
        {val > 0 ? val : ''}
      </td>
    )
  }

  if (leaf.kind === 'time') {
    return (
      <td key={key} className={`col-time-cell${hlCls}`}>
        <TimeCell value={cell.getByKey(ck)} onChange={(raw) => cell.set(ck, raw)} />
      </td>
    )
  }

  if (leaf.kind === 'disq') {
    // Disq-Spalte: manueller Wert hat Vorrang, sonst automatisch aus den
    // Tor-Zellen übernommen (überschreibbar).
    const stored = cell.getByKey(ck)
    const showAuto = stored === '' && autoDisq !== ''
    return (
      <td key={key} className={`col-disq-cell${hlCls}`}>
        <input
          className={`cell-input disq-input${showAuto ? ' disq-auto' : ''}`}
          value={stored === '' ? autoDisq : stored}
          onChange={(e) => cell.set(ck, sanitizeDisq(e.target.value, allowed))}
          onKeyDown={gridNavKeyDown}
        />
      </td>
    )
  }

  const cls = leaf.kind === 'text' ? 'text-input' : leaf.kind === 'buoy' ? 'buoy-input' : 'code-input'
  // Erlaubte Codes: eigener Spalten-Katalog, sonst positionsweiter Fallback.
  const codeSet = leaf.codes ?? defCodes
  const sanitize =
    leaf.kind === 'buoy'
      ? (v: string) => sanitizeBuoy(v, allowed)
      : leaf.kind === 'code'
        ? (v: string) => sanitizeCodeInput(v)
        : undefined
  // Fehler-Felder beim Verlassen auf gültige Codes + Disqualifikationen
  // reduzieren, numerisch sortieren und mit ", " trennen.
  const onBlur =
    leaf.kind === 'code'
      ? (e: React.FocusEvent<HTMLInputElement>) => {
          const f = normalizeCodeCell(e.target.value, codeSet, allowed)
          if (f !== e.target.value) cell.set(ck, f)
        }
      : undefined

  return (
    <td key={key} className={`col-${leaf.kind}-cell${hlCls}`}>
      <input
        className={`cell-input ${cls}`}
        inputMode={leaf.kind === 'buoy' ? 'text' : undefined}
        value={cell.getByKey(ck)}
        onChange={(e) => cell.set(ck, sanitize ? sanitize(e.target.value) : e.target.value)}
        onBlur={onBlur}
        onKeyDown={gridNavKeyDown}
      />
    </td>
  )
}
