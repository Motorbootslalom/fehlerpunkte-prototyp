import { DISQ_TABLE } from './sheetDefs'

// Eingabehilfen für Disqualifikations-Codes.
//   • automatisch Großbuchstaben
//   • nur Codes zulässig, die in der Legende stehen (DISQ_TABLE: A–L, X)
//   • mehrere Codes mit Komma und/oder Leerzeichen getrennt

export const ALLOWED_DISQ: Set<string> = new Set(DISQ_TABLE.map((d) => d.code))

/**
 * Bereinigt eine Disq-Eingabe: Großbuchstaben, nur erlaubte Codes; mehrere
 * Codes werden einheitlich mit ", " getrennt. Egal ob mit Komma, Leerzeichen
 * oder ohne Trenner getippt – "A B", "a,x" und "gf" werden zu "A, B" / "A, X"
 * / "G, F".
 */
export function sanitizeDisq(raw: string): string {
  const codes = [...raw.toUpperCase()].filter((c) => ALLOWED_DISQ.has(c))
  return codes.join(', ')
}

/**
 * Bereinigt eine Bojen-/Tor-Zelle: entweder Punkte (Ziffern) ODER ein einzelner
 * erlaubter Disq-Buchstabe (großgeschrieben).
 */
export function sanitizeBuoy(raw: string): string {
  const up = raw.toUpperCase()
  // Enthält die Eingabe einen erlaubten Buchstaben, gilt sie als Disq-Marke.
  const letter = [...up].find((c) => ALLOWED_DISQ.has(c))
  if (letter) return letter
  // sonst nur Ziffern behalten
  return raw.replace(/\D/g, '')
}
