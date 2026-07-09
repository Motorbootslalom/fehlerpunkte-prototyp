import { useState } from 'react'
import { getSheetDef, KLASSEN_LISTEN_ORDER, SHEET_TYPE_ORDER } from '../lib/sheetDefs'
import { extendNumbers, formatNumbers, parseNumbers, shrinkNumbers } from '../lib/demo'
import { exportSheetsToPdf } from '../lib/exportPdf'
import { useStore } from '../state/store'
import { CLASS_IDS, type ClassId, type Lauf, type SheetTypeId } from '../types'

const LAEUFE: Lauf[] = [1, 2, 3]

/** Steuerungsleiste – nur am Bildschirm sichtbar, im Druck ausgeblendet. */
export function ControlPanel() {
  const { state, dispatch } = useStore()
  const [addType, setAddType] = useState<SheetTypeId>('gate135')
  const [addClass, setAddClass] = useState<ClassId>('3')
  const [addLauf, setAddLauf] = useState<Lauf>(1)
  const [qpLauf, setQpLauf] = useState<Lauf>(1)
  const [busy, setBusy] = useState(false)

  const bulk = (items: { typeId: SheetTypeId; klasse: ClassId; lauf: Lauf }[]) =>
    dispatch({ type: 'ADD_BOEGEN_BULK', items })

  async function downloadPdf() {
    setBusy(true)
    try {
      await exportSheetsToPdf(`Fehlerpunkte_${slug(state.eventName)}.pdf`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="control-panel">
      <h1>Fehlerpunkte-Prototyp</h1>
      <p className="intro">
        Prototyp der WKR-Eingabemasken. Eingabe und Ausdruck sind dieselbe Ansicht – so lässt
        sich jede Eintragung direkt kontrollieren. Alle Daten bleiben lokal im Browser.
      </p>

      <section>
        <label className="field">
          <span>Veranstaltung</span>
          <input
            value={state.eventName}
            onChange={(e) => dispatch({ type: 'SET_EVENT', eventName: e.target.value })}
          />
        </label>
        <label className="field field-nums" style={{ marginTop: 8 }}>
          <span>Leere Zeilen</span>
          <input
            type="number"
            min={0}
            max={30}
            value={state.emptyRows}
            onChange={(e) => dispatch({ type: 'SET_EMPTY_ROWS', emptyRows: Number(e.target.value) })}
          />
        </label>
      </section>

      <section>
        <h2>Export</h2>
        <div className="btn-row">
          <button onClick={() => window.print()} title="Öffnet den Druckdialog; dort auch „Als PDF speichern“">
            🖨 Drucken / Als PDF (Browser)
          </button>
          <button onClick={downloadPdf} disabled={busy}>
            {busy ? '… erzeuge PDF' : '⬇ PDF herunterladen (JS)'}
          </button>
        </div>
        <p className="hint">
          Zwei Wege zum Vergleich: Der Browser-Druck liefert scharfen, auswählbaren Text; die
          JS-Variante lädt eine (rasterisierte) PDF direkt herunter.
        </p>
      </section>

      <section>
        <h2>Bögen ({state.boegen.length})</h2>

        <details className="quickpick">
          <summary className="quickpick-title">Schnellauswahl</summary>
          <div className="qp-body">
            <div className="qp-row">
              <span className="qp-label">Kompletter Lauf (alle Listen × alle Klassen):</span>
              <div className="qp-btns">
                {LAEUFE.map((l) => (
                  <button
                    key={l}
                    title={`Alle ${SHEET_TYPE_ORDER.length} Listentypen × alle Klassen für den ${l}. Lauf`}
                    onClick={() =>
                      bulk(
                        CLASS_IDS.flatMap((c) =>
                          KLASSEN_LISTEN_ORDER.map((t) => ({ typeId: t, klasse: c, lauf: l })),
                        ),
                      )
                    }
                  >
                    + {l}. Lauf
                  </button>
                ))}
              </div>
            </div>

            <div className="qp-row">
              <span className="qp-label">Lauf für die folgenden Auswahlen:</span>
              <div className="qp-btns qp-lauf">
                {LAEUFE.map((l) => (
                  <button
                    key={l}
                    className={qpLauf === l ? 'active' : ''}
                    onClick={() => setQpLauf(l)}
                  >
                    {l}. Lauf
                  </button>
                ))}
              </div>
            </div>

            <div className="qp-row">
              <span className="qp-label">Eine Position · alle Klassen · {qpLauf}. Lauf:</span>
              <div className="qp-btns">
                {SHEET_TYPE_ORDER.map((t) => (
                  <button
                    key={t}
                    title={`${getSheetDef(t).menuLabel} für alle Klassen (${qpLauf}. Lauf)`}
                    onClick={() =>
                      bulk(CLASS_IDS.map((c) => ({ typeId: t, klasse: c, lauf: qpLauf })))
                    }
                  >
                    {getSheetDef(t).title}
                  </button>
                ))}
              </div>
            </div>

            <div className="qp-row">
              <span className="qp-label">Eine Klasse · alle Listen · {qpLauf}. Lauf:</span>
              <div className="qp-btns">
                {CLASS_IDS.map((c) => (
                  <button
                    key={c}
                    title={`Alle Listentypen für Klasse ${c} (${qpLauf}. Lauf)`}
                    onClick={() =>
                      bulk(KLASSEN_LISTEN_ORDER.map((t) => ({ typeId: t, klasse: c, lauf: qpLauf })))
                    }
                  >
                    Kl. {c}
                  </button>
                ))}
              </div>
            </div>

            {state.boegen.length > 0 && (
              <button className="qp-clear" onClick={() => dispatch({ type: 'CLEAR_BOEGEN' })}>
                Liste leeren
              </button>
            )}
          </div>
        </details>

        <ul className="bogen-list">
          {state.boegen.map((b, i) => (
            <li key={b.id}>
              <select
                value={b.typeId}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_BOGEN',
                    id: b.id,
                    patch: { typeId: e.target.value as SheetTypeId },
                  })
                }
              >
                {SHEET_TYPE_ORDER.map((t) => (
                  <option key={t} value={t}>
                    {getSheetDef(t).menuLabel}
                  </option>
                ))}
              </select>
              <select
                value={b.klasse}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_BOGEN',
                    id: b.id,
                    patch: { klasse: e.target.value as ClassId },
                  })
                }
              >
                {CLASS_IDS.map((c) => (
                  <option key={c} value={c}>
                    Kl. {c}
                  </option>
                ))}
              </select>
              <select
                value={b.lauf}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_BOGEN',
                    id: b.id,
                    patch: { lauf: Number(e.target.value) as Lauf },
                  })
                }
              >
                {LAEUFE.map((l) => (
                  <option key={l} value={l}>
                    {l}. Lauf
                  </option>
                ))}
              </select>
              <span className="bogen-actions">
                <button
                  onClick={() => dispatch({ type: 'MOVE_BOGEN', id: b.id, dir: -1 })}
                  disabled={i === 0}
                  title="nach oben"
                >
                  ↑
                </button>
                <button
                  onClick={() => dispatch({ type: 'MOVE_BOGEN', id: b.id, dir: 1 })}
                  disabled={i === state.boegen.length - 1}
                  title="nach unten"
                >
                  ↓
                </button>
                <button
                  onClick={() => dispatch({ type: 'REMOVE_BOGEN', id: b.id })}
                  title="entfernen"
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>

        <div className="add-bogen">
          <select value={addType} onChange={(e) => setAddType(e.target.value as SheetTypeId)}>
            {SHEET_TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {getSheetDef(t).menuLabel}
              </option>
            ))}
          </select>
          <select value={addClass} onChange={(e) => setAddClass(e.target.value as ClassId)}>
            {CLASS_IDS.map((c) => (
              <option key={c} value={c}>
                Kl. {c}
              </option>
            ))}
          </select>
          <select value={addLauf} onChange={(e) => setAddLauf(Number(e.target.value) as Lauf)}>
            {LAEUFE.map((l) => (
              <option key={l} value={l}>
                {l}. Lauf
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              dispatch({ type: 'ADD_BOGEN', typeId: addType, klasse: addClass, lauf: addLauf })
            }
          >
            + Bogen
          </button>
        </div>
      </section>

      <section>
        <details>
          <summary>
            <h2 style={{ display: 'inline' }}>Startnummern</h2>
          </summary>
          <p className="hint">Demo-Nummern (keine echten Daten) – frei editierbar, kommagetrennt.</p>
          {CLASS_IDS.map((c) => {
            const nums = state.numbers[c] ?? []
            return (
              <div className="field field-nums" key={c}>
                <span>Klasse {c}</span>
                <input
                  value={formatNumbers(nums)}
                  onChange={(e) =>
                    dispatch({ type: 'SET_NUMBERS', klasse: c, numbers: parseNumbers(e.target.value) })
                  }
                />
                <span className="nums-btns">
                  <button
                    title="3 Startnummern hinzufügen"
                    onClick={() =>
                      dispatch({ type: 'SET_NUMBERS', klasse: c, numbers: extendNumbers(nums, 3, c) })
                    }
                  >
                    +3
                  </button>
                  <button
                    title="3 Startnummern entfernen"
                    disabled={nums.length === 0}
                    onClick={() =>
                      dispatch({ type: 'SET_NUMBERS', klasse: c, numbers: shrinkNumbers(nums, 3) })
                    }
                  >
                    −3
                  </button>
                </span>
              </div>
            )
          })}
        </details>
      </section>

      <section>
        <button
          className="danger"
          onClick={() => {
            if (confirm('Alle Eingaben und Einstellungen zurücksetzen?')) {
              dispatch({ type: 'RESET_ALL' })
            }
          }}
        >
          Alles zurücksetzen
        </button>
      </section>

      <footer className="cp-footer">
        Konzept-Prototyp · keine echten personenbezogenen Daten
      </footer>
    </aside>
  )
}

function slug(s: string): string {
  return s.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'listen'
}
