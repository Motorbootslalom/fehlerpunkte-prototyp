import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Die Konfiguration (public/config/*.yaml) wird zur Laufzeit per fetch geladen -
// Dateien unter public/ liegen NICHT im Modulgraph, also löst Vite dafür kein
// HMR aus. Dieses Plugin beobachtet die YAMLs und erzwingt bei Änderung ein
// vollständiges Neuladen der Seite (wie beim JS-Code).
function reloadOnConfigYaml(): Plugin {
  const isConfigYaml = (file: string) => {
    const f = file.replace(/\\/g, '/')
    return f.includes('/public/config/') && f.endsWith('.yaml')
  }
  return {
    name: 'reload-on-config-yaml',
    configureServer(server) {
      const onChange = (file: string) => {
        if (!isConfigYaml(file)) return
        server.config.logger.info(`\x1b[36m[config]\x1b[0m ${file.split('/').pop()} geändert - Seite wird neu geladen`)
        server.ws.send({ type: 'full-reload', path: '*' })
      }
      server.watcher.on('change', onChange)
      server.watcher.on('add', onChange)
    },
  }
}

// Relative base ('./') sorgt dafür, dass der Build sowohl auf GitHub Pages
// (Projekt-Unterpfad, z. B. /fehlerpunkte-prototyp/) als auch lokal via preview läuft.
//
// Zwei Einstiegspunkte (Multi-Page) zum Vergleich der PDF-Lösungen:
//   index.html → Browser-Druck / Raster (Haupt-Prototyp)
//   pdf.html   → echtes Vektor-PDF via @react-pdf/renderer
export default defineConfig({
  base: './',
  plugins: [react(), reloadOnConfigYaml()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        pdf: 'pdf.html',
      },
    },
  },
})
