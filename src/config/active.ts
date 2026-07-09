import { load as yamlLoad } from 'js-yaml'
import type { DisqDef, SheetDef } from '../types'
import { buildConfig, type ResolvedConfig } from './build'
import type { RawConfig, RawFehlerpunkte, RawPositionen } from './schema'
// Gebündelte Standard-Konfiguration - immer verfügbar, auch ohne Netz. Die
// Dateien public/config/*.yaml (zur Laufzeit geladen) überschreiben sie.
import bundledFehler from './fehlerpunkte.yaml?raw'
import bundledPositionen from './positionen.yaml?raw'

// Aktive Konfiguration. Wird beim Start via initConfig gesetzt (Laufzeit-YAML);
// solange nicht gesetzt, lazy aus den gebündelten YAMLs geladen (z. B. Tests).
let active: ResolvedConfig | null = null

/** Führt die beiden YAML-Dateien zusammen und baut die Konfiguration. */
export function mergeAndBuild(fehlerText: string, positionenText: string): ResolvedConfig {
  const f = (yamlLoad(fehlerText) as RawFehlerpunkte) ?? {}
  const p = (yamlLoad(positionenText) as RawPositionen) ?? { positionen: [] }
  const raw: RawConfig = { ...f, ...p }
  return buildConfig(raw)
}

export function bundledConfig(): ResolvedConfig {
  return mergeAndBuild(bundledFehler, bundledPositionen)
}

export function initConfig(cfg: ResolvedConfig): void {
  active = cfg
}

function cfg(): ResolvedConfig {
  if (!active) active = bundledConfig()
  return active
}

export function getSheetDef(typeId: string): SheetDef {
  const def = cfg().positions.find((p) => p.typeId === typeId)
  if (!def) throw new Error(`Unbekannte Position: ${typeId}`)
  return def
}

export function getPositions(): SheetDef[] {
  return cfg().positions
}

export function sheetTypeOrder(): string[] {
  return cfg().order
}

export function klassenListenOrder(): string[] {
  return cfg().klassenOrder
}

export function allDisqs(): DisqDef[] {
  return cfg().allDisqs
}
