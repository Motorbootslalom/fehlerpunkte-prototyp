import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import { DISQ_TABLE, getSheetDef } from '../lib/sheetDefs'
import { cellKey, scoreRow } from '../lib/scoring'
import { formatTimeDisplay, parseTime } from '../lib/time'
import { bogenPayload } from '../lib/qr'
import type { AppState, Bogen, CellKind, Column, SheetDef } from '../types'
import { QrPdf } from './Qr'

// Echtes Vektor-PDF via @react-pdf/renderer – zum Vergleich mit dem
// Browser-Druck / Raster-Export. Nutzt dieselben Sheet-Definitionen und
// dieselbe Punkte-/Disq-Logik wie der Haupt-Prototyp.

const INK = '#000000'

const s = StyleSheet.create({
  page: { paddingTop: 16, paddingBottom: 26, paddingHorizontal: 16, fontSize: 8, fontFamily: 'Helvetica' },
  headerBox: { borderWidth: 1.4, borderColor: INK, marginBottom: 5 },
  eventBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1.4,
    borderColor: INK,
    minHeight: 30,
    position: 'relative',
    paddingVertical: 3,
  },
  eventTitle: { fontSize: 15, fontFamily: 'Helvetica-Bold' },
  qrWrap: { position: 'absolute', right: 3, top: 3 },
  headerBody: { flexDirection: 'row' },
  headerLeft: { width: 110, borderRightWidth: 1.4, borderColor: INK },
  hlCell: { borderBottomWidth: 1, borderColor: INK, paddingVertical: 3, textAlign: 'center', fontSize: 9 },
  hlTitle: { fontFamily: 'Helvetica-Bold' },
  wkrBox: { flex: 1, flexDirection: 'row', padding: 4, gap: 4 },
  wkrLabel: { fontSize: 9 },

  table: { borderTopWidth: 0.5, borderLeftWidth: 0.5, borderColor: INK },
  row: { flexDirection: 'row' },
  cell: {
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: INK,
    paddingVertical: 2,
    paddingHorizontal: 2,
    textAlign: 'center',
    justifyContent: 'center',
    minHeight: 14,
  },
  headCell: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, backgroundColor: '#fff' },
  groupCell: { padding: 0, flexDirection: 'column' },
  groupLabel: { textAlign: 'center', fontFamily: 'Helvetica-Bold', fontSize: 7.5, borderBottomWidth: 0.5, borderColor: INK, paddingVertical: 1 },
  subRow: { flexDirection: 'row', flexGrow: 1 },
  shaded: { backgroundColor: '#dcdcdc' },
  sumCell: { backgroundColor: '#fafafa', fontFamily: 'Helvetica-Bold' },
  leftText: { textAlign: 'left' },

  legend: { marginTop: 6, fontSize: 7 },
  legendTitle: { fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginBottom: 2, marginTop: 4 },
  legendRow: { flexDirection: 'row', marginBottom: 0.5 },
  lcCode: { width: 16, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  lcText: { flex: 1 },
  lcPts: { width: 22, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  note: { fontSize: 7, fontStyle: 'italic', marginBottom: 1 },
  courseNote: { fontSize: 7, fontStyle: 'italic', color: '#555', marginTop: 4 },

  signature: { marginTop: 14, alignItems: 'flex-end' },
  sigLine: { width: 160, borderTopWidth: 0.6, borderColor: INK, marginBottom: 2 },
  sigLabel: { fontSize: 8 },
  pageNum: { position: 'absolute', bottom: 10, right: 16, fontSize: 7, color: '#555' },
})

interface Leaf {
  colKey: string
  subIndex?: number
  kind: CellKind
}

function toLeaves(columns: Column[]): Leaf[] {
  return columns.flatMap((col) =>
    col.sub && col.sub.length > 0
      ? col.sub.map((_, i) => ({ colKey: col.key, subIndex: i, kind: col.kind }))
      : [{ colKey: col.key, kind: col.kind }],
  )
}

/** Feste Breite bzw. Flex-Anteil je Spaltenart (für die Ausrichtung). */
function colFlex(kind: CellKind, grow?: number): { width?: number; flexGrow?: number; flexBasis?: number } {
  if (kind === 'sum') return { width: 26 }
  if (kind === 'disq') return { width: 40 }
  if (grow) return { flexGrow: grow, flexBasis: 0 }
  return { flexGrow: 1, flexBasis: 0 }
}

const NR_WIDTH = 26

// Die eingebaute Helvetica (WinAnsi) kennt kein Σ – im PDF als "Pkt." zeigen.
function pdfLabel(label: string): string {
  return label === 'Σ' ? 'Pkt.' : label
}

interface RowData {
  id: string
  nr: string
  fixed: boolean
  shaded: boolean
}

export function SheetsDocument({ state }: { state: AppState }) {
  return (
    <Document title="Fehlerpunkte">
      {state.boegen.map((b) => (
        <SheetPage key={b.id} state={state} bogen={b} />
      ))}
    </Document>
  )
}

function SheetPage({ state, bogen }: { state: AppState; bogen: Bogen }) {
  const def = getSheetDef(bogen.typeId)
  const nums = state.numbers[bogen.klasse] ?? []
  const values = state.values[bogen.id] ?? {}
  const get = (k: string) => values[k] ?? ''

  const rows: RowData[] = nums.map((n) => ({ id: String(n), nr: String(n), fixed: true, shaded: false }))
  for (let i = 0; i < state.emptyRows; i++) rows.push({ id: `_x${i}`, nr: '', fixed: false, shaded: false })
  rows.forEach((r, i) => (r.shaded = (i + 1) % 5 === 0))

  const leaves = toLeaves(def.columns)

  return (
    <Page size="A4" orientation={def.orientation} style={s.page}>
      {/* Kopf + Spaltenüberschriften wiederholen sich auf JEDER Seite. */}
      <View fixed>
        <Header state={state} bogen={bogen} def={def} />
        <View style={[s.table, { borderBottomWidth: 0 }]}>
          <HeaderRows def={def} />
        </View>
      </View>

      <View style={[s.table, { borderTopWidth: 0 }]}>
        {rows.map((row) => {
          const rowKey = row.fixed ? row.nr : row.id
          const score = scoreRow(def, rowKey, get)
          const autoDisq = Array.from(
            new Set(score.disqs.filter((d) => d.where !== 'Disq.').map((d) => d.code)),
          ).join(', ')
          const nrText = row.fixed ? row.nr : get(cellKey(row.id, '__nr'))
          return (
            <View key={row.id} style={[s.row, row.shaded ? s.shaded : {}]} wrap={false}>
              <Text style={[s.cell, { width: NR_WIDTH }, s.headCell]}>{nrText}</Text>
              {leaves.map((leaf, li) => (
                <DataCell
                  key={li}
                  leaf={leaf}
                  col={def.columns.find((c) => c.key === leaf.colKey)!}
                  rowKey={rowKey}
                  get={get}
                  score={score}
                  autoDisq={autoDisq}
                />
              ))}
            </View>
          )
        })}
      </View>

      <Legend def={def} bogen={bogen} />

      <View style={s.signature}>
        <View style={s.sigLine} />
        <Text style={s.sigLabel}>Unterschrift WKR</Text>
      </View>

      <Text
        style={s.pageNum}
        fixed
        render={({ pageNumber, totalPages }) => `Seite ${pageNumber} / ${totalPages}`}
      />
    </Page>
  )
}

function Header({ state, bogen, def }: { state: AppState; bogen: Bogen; def: SheetDef }) {
  return (
    <View style={s.headerBox}>
      <View style={s.eventBar}>
        <Text style={s.eventTitle}>{state.eventName}</Text>
        <View style={s.qrWrap}>
          <QrPdf payload={bogenPayload(state.eventName, bogen)} size={40} />
        </View>
      </View>
      <View style={s.headerBody}>
        <View style={s.headerLeft}>
          <Text style={[s.hlCell, s.hlTitle]}>{def.title}</Text>
          <Text style={s.hlCell}>Klasse {bogen.klasse}</Text>
          <Text style={[s.hlCell, { borderBottomWidth: 0 }]}>{bogen.lauf}. Lauf</Text>
        </View>
        <View style={s.wkrBox}>
          <Text style={s.wkrLabel}>WKR: {state.wkr[bogen.id] ?? ''}</Text>
        </View>
      </View>
    </View>
  )
}

function HeaderRows({ def }: { def: SheetDef }) {
  return (
    <View style={s.row}>
      <Text style={[s.cell, s.headCell, { width: NR_WIDTH }]}>Nr.</Text>
      {def.columns.map((col) => {
        const flex = colFlex(col.kind, col.grow)
        if (col.sub && col.sub.length > 0) {
          return (
            <View key={col.key} style={[s.cell, s.groupCell, { flexGrow: col.sub.length, flexBasis: 0 }]}>
              <Text style={s.groupLabel}>{col.label}</Text>
              <View style={s.subRow}>
                {col.sub.map((sub, i) => (
                  <Text
                    key={i}
                    style={[
                      s.headCell,
                      { flexGrow: 1, flexBasis: 0, textAlign: 'center', paddingVertical: 1 },
                      i < col.sub!.length - 1 ? { borderRightWidth: 0.5, borderColor: INK } : {},
                    ]}
                  >
                    {sub}
                  </Text>
                ))}
              </View>
            </View>
          )
        }
        return (
          <Text key={col.key} style={[s.cell, s.headCell, flex]}>
            {pdfLabel(col.label)}
          </Text>
        )
      })}
    </View>
  )
}

function DataCell({
  leaf,
  col,
  rowKey,
  get,
  score,
  autoDisq,
}: {
  leaf: Leaf
  col: Column
  rowKey: string
  get: (k: string) => string
  score: ReturnType<typeof scoreRow>
  autoDisq: string
}) {
  const flex = colFlex(leaf.kind, col.grow)
  const ck = cellKey(rowKey, leaf.colKey, leaf.subIndex)

  let text = ''
  let extra: Style = {}
  if (leaf.kind === 'sum') {
    const val = leaf.colKey in score.computedCols ? score.computedCols[leaf.colKey] : score.sum
    text = val > 0 ? String(val) : ''
    extra = s.sumCell
  } else if (leaf.kind === 'disq') {
    const stored = get(ck)
    text = stored === '' ? autoDisq : stored
  } else if (leaf.kind === 'time') {
    const parsed = parseTime(get(ck))
    text = parsed ? formatTimeDisplay(parsed.centis) : ''
  } else {
    text = get(ck)
    if (leaf.kind === 'text' || leaf.kind === 'code') extra = s.leftText
  }

  return <Text style={[s.cell, flex, extra]}>{text}</Text>
}

function Legend({ def, bogen }: { def: SheetDef; bogen: Bogen }) {
  return (
    <View style={s.legend}>
      {def.errorTable && (
        <View>
          <Text style={s.legendTitle}>{def.errorTableTitle ?? 'Fehler:'}</Text>
          {def.errorTable.map((e) => (
            <View key={e.code} style={s.legendRow}>
              <Text style={s.lcCode}>{e.code}</Text>
              <Text style={s.lcText}>{e.text}</Text>
              <Text style={s.lcPts}>{e.punkte}</Text>
            </View>
          ))}
        </View>
      )}

      {def.legendNote && <Text style={s.note}>{def.legendNote}</Text>}

      {def.showDisqTable && (
        <View>
          <Text style={s.legendTitle}>Disqualifikation:</Text>
          {DISQ_TABLE.map((d) => (
            <View key={d.code} style={s.legendRow}>
              <Text style={s.lcCode}>{d.code}</Text>
              <Text style={s.lcText}>{d.text}</Text>
            </View>
          ))}
        </View>
      )}

      {def.courseImageDir && (
        <Text style={s.courseNote}>
          (Parcoursbild Klasse {bogen.klasse} – im Vektor-Prototyp nicht eingebettet)
        </Text>
      )}
    </View>
  )
}
