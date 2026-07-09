// PDF-Export über JavaScript-Bibliotheken (html2canvas + jsPDF).
//
// Dies ist die ZWEITE Export-Variante zum Vergleich mit dem Browser-Druck.
// Sie rastert jede Bogen-Seite in ein Bild und legt es auf eine A4-Seite.
// Vorteil: echter Download ohne Druckdialog. Nachteil: rasterisierter Text
// (nicht so scharf/selektierbar wie beim Browser-Druck / "Als PDF speichern").
//
// Die schweren Bibliotheken werden erst beim Klick dynamisch geladen.

export async function exportSheetsToPdf(fileName: string): Promise<void> {
  const [{ default: html2canvas }, jspdf] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])
  const { jsPDF } = jspdf

  const sheets = Array.from(document.querySelectorAll<HTMLElement>('.sheet'))
  if (sheets.length === 0) return

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  for (let i = 0; i < sheets.length; i++) {
    const el = sheets[i]
    const landscape = el.classList.contains('sheet--landscape')
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    })
    const img = canvas.toDataURL('image/jpeg', 0.92)

    const pageW = landscape ? 297 : 210
    const pageH = landscape ? 210 : 297

    if (i > 0) pdf.addPage('a4', landscape ? 'landscape' : 'portrait')
    // Bild in die Seite einpassen (Seitenverhältnis erhalten).
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height)
    const w = canvas.width * ratio
    const h = canvas.height * ratio
    const x = (pageW - w) / 2
    const y = (pageH - h) / 2
    pdf.addImage(img, 'JPEG', x, y, w, h)
  }

  pdf.save(fileName)
}
