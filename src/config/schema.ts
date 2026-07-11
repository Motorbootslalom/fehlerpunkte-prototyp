// Roh-Struktur der YAML-Konfiguration. Sie ist auf zwei Dateien verteilt:
//   • fehlerpunkte.yaml - Disqualifikationen + Fehler-Kataloge (aus der
//     Ausschreibung, i. d. R. für alle gleich)
//   • positionen.yaml   - Hinweise + Positionen (orts-/personenabhängig),
//     die Kataloge und Hinweise per Verweis (ID) einbinden
// Aus der zusammengeführten Struktur erzeugt build.ts die interne Darstellung.

export interface RawDisq {
  code: string
  text: string
}

export interface RawFehler {
  code: string | number
  text: string
  punkte: number
}

/** Benannter Fehler-Katalog (z. B. "mueb", "steg", "tor5"). */
export interface RawKatalog {
  titel?: string
  fehler: RawFehler[]
}

/** fehlerpunkte.yaml */
export interface RawFehlerpunkte {
  disqualifikationen?: RawDisq[]
  kataloge?: Record<string, RawKatalog>
}

export type RawSpaltenTyp = 'boje' | 'code' | 'punkte' | 'zeit' | 'disq' | 'text' | 'summe'

export interface RawSpalte {
  key: string
  label: string
  typ: RawSpaltenTyp
  /** Unter-Spalten (z. B. Bojen-Bezeichnungen [H K, H H]) - nur bei 'boje'. */
  sub?: string[]
  /**
   * Welche physische Seite (seiteA/seiteB) an diesem Tor die INNERE Boje ist.
   * Nur an den Toren 1-4 gesetzt. Wird das Schema "Innen/Außen" gewählt, werden
   * die Bojen-Seiten dieser Spalte relativ (Innen/Außen) statt physisch (R/L)
   * beschriftet. Tor 5/Start/Ziel bleiben ohne Angabe bei R/L.
   */
  innen?: 'seiteA' | 'seiteB'
  /** Nur 'code': Schlüssel der 'summe'-Spalte, in der die Punkte erscheinen. */
  punkteSpalte?: string
  /**
   * Nur 'code': eigener Fehler-Katalog dieser Spalte (Verweis auf
   * fehlerpunkte.kataloge.<id>). Ohne Angabe gilt der positionsweite `katalog`.
   * Damit lassen die Spalten Steg AB/AN je nur ihre eigenen Codes zu.
   */
  katalog?: string
  /** Relative Breite (Flex-Anteil). */
  breite?: number
}

export interface RawPosition {
  id: string
  titel: string
  menue?: string
  ausrichtung?: 'hoch' | 'quer'
  /** Lauf im Kopf zeigen? false z. B. bei Knoten (nur einmal abgenommen). */
  lauf?: boolean
  /** Bild-Ordner unter public/parcours (z. B. alcatraz_Parcours). */
  bild?: string
  /** Bild-Drehung in Grad: 0 | 90 | -90 | 180. */
  bildDrehung?: number
  /** Verweis auf hinweise.<id> (oder direkter Text, falls kein Treffer). */
  hinweis?: string
  /** Verweis auf fehlerpunkte.kataloge.<id> (Fehlercodes → Punkte). */
  katalog?: string
  /** Welche Disqualifikationen: 'alle', 'keine' oder Liste von Codes. */
  disq?: 'alle' | 'keine' | string[]
  /** Schlüssel der Spalte, die die Zeilensumme (Σ) berechnet zeigt. */
  summeSpalte?: string
  spalten: RawSpalte[]
}

/**
 * Ein auf der Seite umschaltbares Bezeichnungs-Schema (z. B. Rechts/Links,
 * Land/See, Hafen/Kai). `tokens` überschreibt die globalen `bezeichnungen`
 * (typischerweise seiteA/seiteB) - so lässt sich die Bojen-Beschriftung ohne
 * YAML-Änderung live umstellen.
 */
export interface RawBeschriftung {
  id: string
  name: string
  tokens: Record<string, string>
}

/** Ein Aufbau (Setup) bündelt die bei einem Wettkampf genutzten Positionen. */
export interface RawAufbau {
  id: string
  name: string
  /** Positions-IDs in Reihenfolge (auch gemeinsame wie zeit, knoten …). */
  positionen: string[]
}

/** positionen.yaml */
export interface RawPositionen {
  /**
   * Globale Bojen-Kürzel als Token-Map, z. B. { hin: "H", rueck: "Z",
   * seiteA: "R", seiteB: "L" }. In Spalten-`sub` und Hinweisen werden diese
   * Tokens (als ganze Wörter) durch die Kürzel ersetzt - so lassen sich die
   * Bezeichnungen (R/L, L/S, H/K …) an einer Stelle umstellen.
   */
  bezeichnungen?: Record<string, string>
  /**
   * Auf der Seite umschaltbare Bezeichnungs-Schemata. Das erste ist der
   * Standard; wird eines gewählt, überschreiben seine `tokens` die
   * `bezeichnungen` und die Konfiguration wird neu gebaut.
   */
  beschriftungen?: RawBeschriftung[]
  /** Wiederverwendbare Hinweistexte (Bojen-Bezeichnungen). */
  hinweise?: Record<string, string>
  /** Aufbauten (Setups); der erste ist der Standard. */
  aufbauten?: RawAufbau[]
  /** Alle Positionen (werden von den Aufbauten per ID referenziert). */
  positionen: RawPosition[]
}

/** Zusammengeführte Roh-Konfiguration (beide Dateien). */
export interface RawConfig extends RawFehlerpunkte, RawPositionen {}
