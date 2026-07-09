import { DISQ_TABLE } from '../lib/sheetDefs'
import type { SheetDef } from '../types'

/** Fußbereich eines Bogens: Fehlertabelle, Hinweise und Disqualifikations-Codes. */
export function Legend({ def }: { def: SheetDef }) {
  return (
    <div className="legend">
      {def.errorTable && (
        <div className="legend-block">
          <div className="legend-title">{def.errorTableTitle ?? 'Fehler:'}</div>
          <table className="legend-errors">
            <tbody>
              {def.errorTable.map((e) => (
                <tr key={e.code}>
                  <td className="lc-code">{e.code}</td>
                  <td className="lc-text">{e.text}</td>
                  <td className="lc-pts">{e.punkte}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {def.legendNote && <div className="legend-note">{def.legendNote}</div>}

      {def.showDisqTable && (
        <div className="legend-block">
          <div className="legend-title">Disqualifikation:</div>
          <table className="legend-disq">
            <tbody>
              {DISQ_TABLE.map((d) => (
                <tr key={d.code}>
                  <td className="lc-code">{d.code}</td>
                  <td className="lc-text">{d.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
