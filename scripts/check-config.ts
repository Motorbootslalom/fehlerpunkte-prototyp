// CLI-Prüfung der YAML-Konfiguration. Aufruf: `npm run config:check`
// (bzw. `node scripts/check-config.ts`). Prüft die gebündelten Dateien unter
// src/config und die zur Laufzeit geladenen unter public/config auf:
//   • Syntax / doppelte Mapping-Keys (Parser)
//   • doppelte Definitionen & Verweise ins Leere (semantischer Validator)
//   • Drift zwischen src/config und public/config (sollten identisch sein)
//   • einfache Format-Hygiene (Tabs, Leerzeichen am Zeilenende, Schluss-Newline)
// Exit-Code 1, sobald ein Fehler (nicht: Warnung) auftritt - für CI/Hooks.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { validateConfigTexts, type ConfigIssue } from '../src/config/validate.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const useColor = process.stdout.isTTY && !process.env.NO_COLOR
const c = (code: string, s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s)
const red = (s: string) => c('31', s)
const yellow = (s: string) => c('33', s)
const green = (s: string) => c('32', s)
const dim = (s: string) => c('2', s)
const bold = (s: string) => c('1', s)

function read(rel: string): string | null {
  try {
    return readFileSync(resolve(root, rel), 'utf8')
  } catch {
    return null
  }
}

/** Nicht-destruktive Format-Hygiene (nur Hinweise, keine Umformatierung). */
function formatIssues(text: string, file: string): ConfigIssue[] {
  const out: ConfigIssue[] = []
  const lines = text.split('\n')
  lines.forEach((line, i) => {
    if (line.includes('\t'))
      out.push({ severity: 'warning', code: 'FMT_TAB', message: 'Tabulator statt Leerzeichen.', where: `${file}:${i + 1}` })
    if (/[ \t]+$/.test(line))
      out.push({ severity: 'warning', code: 'FMT_TRAILING_WS', message: 'Leerzeichen am Zeilenende.', where: `${file}:${i + 1}` })
    if (line.endsWith('\r'))
      out.push({ severity: 'warning', code: 'FMT_CRLF', message: 'CRLF-Zeilenende (LF erwartet).', where: `${file}:${i + 1}` })
  })
  if (text.length > 0 && !text.endsWith('\n'))
    out.push({ severity: 'warning', code: 'FMT_EOF_NEWLINE', message: 'Kein Zeilenumbruch am Dateiende.', where: file })
  return out
}

interface Pair {
  label: string
  fehler: string
  positionen: string
}

const PAIRS: Pair[] = [
  { label: 'src/config (gebündelt)', fehler: 'src/config/fehlerpunkte.yaml', positionen: 'src/config/positionen.yaml' },
  { label: 'public/config (Laufzeit)', fehler: 'public/config/fehlerpunkte.yaml', positionen: 'public/config/positionen.yaml' },
]

function printIssues(issues: ConfigIssue[]): void {
  for (const it of issues) {
    const tag = it.severity === 'error' ? red('FEHLER ') : yellow('Hinweis')
    console.log(`  ${tag} ${dim(`[${it.code}]`)} ${it.where}\n          ${it.message}`)
  }
}

let errorCount = 0
let warnCount = 0

console.log(bold('\n▶ Konfigurations-Check\n'))

for (const pair of PAIRS) {
  const fehler = read(pair.fehler)
  const positionen = read(pair.positionen)
  console.log(bold(pair.label))
  if (fehler === null || positionen === null) {
    console.log(`  ${dim('übersprungen - Datei fehlt')}\n`)
    continue
  }
  const issues = [
    ...validateConfigTexts(fehler, positionen),
    ...formatIssues(fehler, pair.fehler),
    ...formatIssues(positionen, pair.positionen),
  ]
  const errs = issues.filter((i) => i.severity === 'error')
  const warns = issues.filter((i) => i.severity === 'warning')
  errorCount += errs.length
  warnCount += warns.length
  if (issues.length === 0) console.log(`  ${green('✔ keine Befunde')}`)
  else printIssues([...errs, ...warns])
  console.log()
}

// ---- Drift-Check: src/config und public/config sollten identisch sein -------
console.log(bold('Abgleich src/config ↔ public/config'))
for (const name of ['fehlerpunkte.yaml', 'positionen.yaml']) {
  const a = read(`src/config/${name}`)
  const b = read(`public/config/${name}`)
  if (a === null || b === null) continue
  if (a !== b) {
    warnCount++
    console.log(`  ${yellow('Hinweis')} ${dim('[DRIFT]')} ${name}`)
    console.log(`          src/config/${name} und public/config/${name} unterscheiden sich.`)
  } else {
    console.log(`  ${green('✔')} ${name} identisch`)
  }
}
console.log()

// ---- Zusammenfassung --------------------------------------------------------
const summary = `${errorCount} Fehler, ${warnCount} Hinweis(e)`
if (errorCount > 0) {
  console.log(red(bold(`✖ ${summary}`)))
  process.exit(1)
}
console.log(green(bold(`✔ ${summary}`)))
