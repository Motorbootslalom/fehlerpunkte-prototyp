import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base ('./') sorgt dafür, dass der Build sowohl auf GitHub Pages
// (Projekt-Unterpfad, z. B. /fehlerpunkte-prototyp/) als auch lokal via preview läuft.
//
// Zwei Einstiegspunkte (Multi-Page) zum Vergleich der PDF-Lösungen:
//   index.html → Browser-Druck / Raster (Haupt-Prototyp)
//   pdf.html   → echtes Vektor-PDF via @react-pdf/renderer
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        pdf: 'pdf.html',
      },
    },
  },
})
