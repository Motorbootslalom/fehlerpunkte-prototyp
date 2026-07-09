import type { Column, DisqDef, ErrorDef, SheetDef, SheetTypeId } from '../types'

// Alle Werte stammen 1:1 aus den bestehenden Excel-/PDF-Listen
// ("alte PDF-Listen") des Möwepokals.

/** Disqualifikations-Codes A–X (auf allen Listen identisch). */
export const DISQ_TABLE: DisqDef[] = [
  { code: 'A', text: 'Fahren ohne Quickstop / Falsches Tragen der Sicherheitsausrüstung (Helm / Weste)' },
  { code: 'B', text: 'Berührung Start - Ziel - Zeitmessanlage (nicht die Bojen)' },
  { code: 'C', text: 'Rückwärtsfahren ab & bis Start/Ziel-Tor (außer Tor 5)' },
  { code: 'D', text: 'Wiederholtes Anfahren ab 4. Versuch' },
  { code: 'E', text: 'Sitzen auf dem Schlauch (auch in gebückter Haltung)' },
  { code: 'F', text: 'Stehen im Boot (außer zum Ein- und Aussteigen und Anreißen des Motors)' },
  { code: 'G', text: 'Überfahren einer Boje oder des Mann-über-Bord' },
  { code: 'H', text: 'Anfahren zur Umrundung Tor 1 mit Backbordseite (Klasse 5 - 7)' },
  { code: 'I', text: 'Anfahren zur Umrundung Tor 1 mit Steuerbordseite (Klasse 3 und 4)' },
  { code: 'J', text: 'Auslassen eines Tores/falscher Parcours/Anlegen auf der falschen Seite' },
  { code: 'K', text: 'Ablegen des Quickstop (außer Motorstart bzw. Belegen der Klampe mit Leerlauf)' },
  { code: 'L', text: 'Anfahren MüB oder ablegen des Ringes an Steuerbord' },
  { code: 'X', text: 'Nicht gestartet' },
]

const MUEB_ERRORS: ErrorDef[] = [
  { code: '13', text: 'kein Leerlauf', punkte: 5 },
  { code: '14', text: 'Rettungsring nicht mit beiden Händen über die Stange gehoben', punkte: 5 },
  { code: '15', text: 'Rettungsring nicht mit beiden Händen aufgelegt', punkte: 5 },
  { code: '16', text: 'Durchreißen der Schaltung / erst ab Klasse 5', punkte: 5 },
  { code: '17', text: 'Nicht vollständig aufgestoppt', punkte: 5 },
  { code: '18', text: 'Rettungsring geworfen oder fallengelassen', punkte: 5 },
  { code: '19', text: '2. und 3. Versuch des Elementes', punkte: 5 },
]

const STEG_ERRORS: ErrorDef[] = [
  // Ablegen
  { code: '3', text: 'erneute Stegberührung', punkte: 5 },
  { code: '4', text: 'Treten auf den Schlauch / ab Klasse 3', punkte: 5 },
  { code: '5', text: 'Durchreißen der Schaltung / erst ab Klasse 5', punkte: 5 },
  // Anlegen
  { code: '7', text: '2. und 3. Versuch des Elementes', punkte: 5 },
  { code: '8', text: 'Festmacherleine nicht im Anlegebereich', punkte: 5 },
  { code: '9', text: 'Massive Stegberührung', punkte: 10 },
  { code: '10', text: 'Durchreißen der Schaltung / erst ab Klasse 5', punkte: 5 },
  { code: '11', text: 'Rückwärtsfahren auf dem Weg zum Steg', punkte: 5 },
  { code: '12', text: 'Boot nicht im Stillstand/kein Leerlauf, obwohl Hand am Steg', punkte: 10 },
]

const TOR5_ERRORS: ErrorDef[] = [
  { code: '1', text: 'nicht mit gesamter Länge eingefahren', punkte: 20 },
  { code: '2', text: 'Durchreißen der Schaltung / erst ab Klasse 5', punkte: 5 },
]

// ---- Spalten-Bausteine für die Tor-Listen -------------------------------

function buoy(key: string, label: string, sub: string[]): Column {
  return { key, label, kind: 'buoy', sub }
}

const GATE_135_COLUMNS: Column[] = [
  buoy('start', 'Start', ['H K']),
  buoy('t1a', 'Tor 1', ['H K', 'H H']),
  buoy('t3a', 'Tor 3', ['H K', 'H H']),
  buoy('t5', 'Tor 5', ['H K', 'R K']),
  buoy('t3b', 'Tor 3', ['R K', 'R H']),
  buoy('t1b', 'Tor 1', ['R K', 'R H']),
  buoy('ziel', 'Ziel', ['R K']),
  { key: 'disq', label: 'Disq.', kind: 'disq' },
  { key: 'sum', label: 'Σ', kind: 'sum' },
]

const GATE_245_COLUMNS: Column[] = [
  buoy('start', 'Start', ['H H']),
  buoy('t2a', 'Tor 2', ['H K', 'H H']),
  buoy('t4a', 'Tor 4', ['H K', 'H H']),
  buoy('t5', 'Tor 5', ['H H', 'R H']),
  buoy('t4b', 'Tor 4', ['R K', 'R H']),
  buoy('t2b', 'Tor 2', ['R K', 'R H']),
  buoy('ziel', 'Ziel', ['R H']),
  { key: 'disq', label: 'Disq.', kind: 'disq' },
  { key: 'sum', label: 'Σ', kind: 'sum' },
]

// Ein Eintrag je Zeile (wird im Fuß zeilenweise dargestellt).
const BLICKRICHTUNG_NOTE = [
  'Blickrichtung: Start / Ziel zum T 5 – linke Boje = »Hafen« / rechte Boje = »Kai«',
  'H H = Hinfahrt Hafen/Links',
  'H K = Hinfahrt Kai/Rechts',
  'R H = Rückfahrt Hafen/Links',
  'R K = Rückfahrt Kai/Rechts',
  'Start = Berührung Einfahrt-Bojentor',
  'Ziel = Berührung Ausfahrt-Bojentor',
  'Fehler: pro berührter Boje (auch außerhalb des Manövers) = 5',
].join('\n')

// ---- Sheet-Definitionen -------------------------------------------------

export const SHEET_DEFS: Record<SheetTypeId, SheetDef> = {
  gate135: {
    typeId: 'gate135',
    title: 'Tor 1 / 3 / 5',
    menuLabel: 'Tore 1 / 3 / 5 (Alcatraz)',
    orientation: 'portrait',
    columns: GATE_135_COLUMNS,
    sumColumnKey: 'sum',
    legendNote: BLICKRICHTUNG_NOTE,
    showDisqTable: true,
    courseImageDir: 'alcatraz_I',
  },
  gate245: {
    typeId: 'gate245',
    title: 'Tor 2 / 4 / 5',
    menuLabel: 'Tore 2 / 4 / 5 (Alcatraz)',
    orientation: 'portrait',
    columns: GATE_245_COLUMNS,
    sumColumnKey: 'sum',
    legendNote: BLICKRICHTUNG_NOTE,
    showDisqTable: true,
    courseImageDir: 'alcatraz_II',
  },
  tor5: {
    typeId: 'tor5',
    title: 'Tor 5',
    menuLabel: 'Tor 5 (Einfahrt + Parcoursüberwachung)',
    orientation: 'portrait',
    columns: [
      { key: 'fehler', label: 'Fehler', kind: 'code', pointsCol: 'sum', grow: 1 },
      { key: 'sum', label: 'Σ', kind: 'sum' },
      { key: 'disq', label: 'Disq.', kind: 'disq' },
      { key: 'bemerkung', label: 'Bemerkung', kind: 'text', grow: 3 },
    ],
    sumColumnKey: 'sum',
    errorTable: TOR5_ERRORS,
    errorTableTitle: 'Einfahrt Tor 5 (gleichzeitig Parcoursüberwachung):',
    showDisqTable: true,
    courseImageDir: 'alcatraz_Parcours',
  },
  mueb: {
    typeId: 'mueb',
    title: 'Mann-über-Bord',
    menuLabel: 'Mann-über-Bord / Schikane',
    orientation: 'portrait',
    columns: [
      { key: 'fehler', label: 'Fehler', kind: 'code', pointsCol: 'fp', grow: 1 },
      { key: 'fp', label: 'Fehlerpunkte', kind: 'sum' },
      { key: 'sum', label: 'Σ', kind: 'sum' },
      { key: 'disq', label: 'Disq.', kind: 'disq' },
      { key: 'bemerkung', label: 'Bemerkung', kind: 'text', grow: 3 },
    ],
    sumColumnKey: 'sum',
    errorTable: MUEB_ERRORS,
    errorTableTitle: 'Fehler (MüB):',
    showDisqTable: true,
  },
  steg: {
    typeId: 'steg',
    title: 'Steg',
    menuLabel: 'Steg (Ablegen / Anlegen)',
    orientation: 'portrait',
    columns: [
      { key: 'fehlerAB', label: 'Fehler AB', kind: 'code', pointsCol: 'fpab', grow: 1 },
      { key: 'fpab', label: 'F-punkte', kind: 'sum' },
      { key: 'fehlerAN', label: 'Fehler AN', kind: 'code', pointsCol: 'fpan', grow: 1 },
      { key: 'fpan', label: 'F-Punkte', kind: 'sum' },
      { key: 'disq', label: 'Disq.', kind: 'disq' },
      { key: 'bemerkung', label: 'Bemerkung', kind: 'text', grow: 2 },
    ],
    errorTable: STEG_ERRORS,
    errorTableTitle: 'Ablegen (AB): 3–5 · Anlegen (AN): 7–12',
    showDisqTable: true,
  },
  zeit: {
    typeId: 'zeit',
    title: 'Zeit',
    menuLabel: 'Zeitnahme',
    orientation: 'portrait',
    columns: [
      // Ohne feste Breite → die drei Zeitspalten teilen sich den Platz
      // gleichmäßig, die Nr.-Spalte bleibt schmal.
      { key: 'zeit1', label: 'Zeit 1', kind: 'time' },
      { key: 'zeit2', label: 'Zeit 2', kind: 'time' },
      { key: 'zeit3', label: 'Zeit 3', kind: 'time' },
    ],
  },
  knoten: {
    typeId: 'knoten',
    title: 'Knoten',
    menuLabel: 'Knoten',
    orientation: 'landscape',
    columns: [
      { key: 'webleinstek', label: 'Webleinstek', kind: 'buoy', grow: 1 },
      { key: 'schotstek', label: 'Schotstek', kind: 'buoy', grow: 1 },
      { key: 'palsteg', label: 'Palsteg', kind: 'buoy', grow: 1 },
      { key: 'kreuzknoten', label: 'Kreuzknoten', kind: 'buoy', grow: 1 },
      { key: 'klampe', label: 'Klampe', kind: 'buoy', grow: 1 },
      { key: 'stern', label: '*', kind: 'buoy', grow: 1 },
      { key: 'sum', label: 'Σ', kind: 'sum' },
    ],
    sumColumnKey: 'sum',
    legendNote: 'Fehler: 5 pro fehlerhafter Knoten',
  },
  parcours: {
    typeId: 'parcours',
    title: 'Parcours',
    menuLabel: 'Parcours einfach (nur Fahrweg)',
    orientation: 'portrait',
    columns: [
      { key: 'bemerkung', label: 'Bemerkung', kind: 'text', grow: 4 },
      { key: 'disq', label: 'Disq.', kind: 'disq' },
    ],
    showDisqTable: true,
    legendNote:
      'Es ist nur der eigentliche Fahrweg zu beobachten – keine Bojenberührungen!',
    courseImageDir: 'alcatraz_Parcours',
  },
}

export const SHEET_TYPE_ORDER: SheetTypeId[] = [
  'gate135',
  'gate245',
  'tor5',
  'mueb',
  'steg',
  'zeit',
  'knoten',
  'parcours',
]

// Reihenfolge, in der die Bögen einer Klasse (alle Positionen) angelegt werden.
export const KLASSEN_LISTEN_ORDER: SheetTypeId[] = [
  'zeit',
  'steg',
  'gate135',
  'gate245',
  'tor5',
  'mueb',
  'parcours',
  'knoten',
]

export function getSheetDef(typeId: SheetTypeId): SheetDef {
  return SHEET_DEFS[typeId]
}
