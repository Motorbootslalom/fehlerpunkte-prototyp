import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'
import { getSheetDef } from '../lib/sheetDefs'
import { describeBoegen, exportBaseName } from '../lib/print'
import { useStore } from '../state/store'
import { SheetsDocument } from './SheetsDocument'

// Zweiter Prototyp: echtes Vektor-PDF via @react-pdf/renderer.
// Konfiguriert wird im Haupt-Prototyp (gemeinsamer localStorage-Zustand);
// hier gibt es eine Live-Vorschau und einen echten Ein-Klick-Download.

export function PdfApp() {
  const { state } = useStore()
  const doc = <SheetsDocument state={state} />
  const name =
    exportBaseName(
      state.eventName,
      describeBoegen(state.boegen, (t) => getSheetDef(t).title),
      new Date(),
    ) + '.pdf'

  return (
    <div className="pdf-app">
      <header className="pdf-bar">
        <div className="pdf-bar-left">
          <strong>Vektor-PDF-Prototyp</strong>
          <span className="pdf-sub">react-pdf · scharfer Text · Vektor-QR · Ein-Klick-Download</span>
        </div>
        <div className="pdf-bar-right">
          <a href="./index.html" className="pdf-back">
            ← Haupt-Prototyp
          </a>
          {state.boegen.length > 0 && (
            <PDFDownloadLink document={doc} fileName={name} className="pdf-dl">
              {({ loading }) => (loading ? '… erzeuge PDF' : '⬇ PDF herunterladen')}
            </PDFDownloadLink>
          )}
        </div>
      </header>

      {state.boegen.length === 0 ? (
        <p className="pdf-empty">
          Keine Bögen ausgewählt. Bitte im{' '}
          <a href="./index.html">Haupt-Prototyp</a> Bögen zusammenstellen und diese Seite neu
          laden.
        </p>
      ) : (
        <PDFViewer className="pdf-viewer" showToolbar>
          {doc}
        </PDFViewer>
      )}
    </div>
  )
}
