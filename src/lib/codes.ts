// Formatierung der Fehlercode-Felder (z. B. Steg "Fehler AB/AN", MüB, Tor 5).
// Beim Verlassen des Feldes werden die eingegebenen Codes numerisch sortiert
// und einheitlich mit ", " getrennt. Beispiel: "12 9" → "9, 12".
// Mehrfachnennungen bleiben erhalten (sie zählen als mehrere Fehler).

export function formatCodes(raw: string): string {
  const nums = raw
    .split(/[\s,;/]+/)
    .map((t) => t.trim())
    .filter((t) => /^\d+$/.test(t))
    .map(Number)
    .sort((a, b) => a - b)
  return nums.join(', ')
}
