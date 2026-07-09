# Fehlerpunkte – Motorbootslalom (Prototyp)

**Live-Demo:** _(nach Deploy)_ <https://motorbootslalom.github.io/fehlerpunkte-prototyp/>

Interaktiver Konzept-**Prototyp** für die **Eingabemasken der
Wettkampfrichter-Fehlerpunktlisten** (WKR-Listen) beim Motorboot-/Schlauchboot­slalom.
Schwesterprojekt zu *verzahnungs-prototyp*.

Ziel: mit den Fachteams abstimmen, wie eine Eingabemaske für Fehlerpunkte aussehen
kann, und das anderen Entwicklern anschaulich erklären. Kernidee (wie bei der
bisherigen Excel-Lösung): **Eingabe und Ausdruck sind dieselbe Ansicht** – so ist
die Kontrolle der Eintragungen extrem einfach.

Die ausführlichen Anforderungen stehen im **[Lastenheft](./LASTENHEFT.md)**.

Es werden **keine echten personenbezogenen Daten** verarbeitet; alle Eingaben
bleiben ausschließlich **lokal im Browser** (localStorage) und überleben ein Reload.

## Funktionen

- **Acht Listentypen**, jeweils als originalgetreuer A4-Bogen (Knoten im
  Querformat): Tore 1/3/5, Tore 2/4/5, Tor 5, Mann-über-Bord/Schikane, Steg,
  Zeit, Knoten, Parcours einfach.
- **WYSIWYG:** Bildschirm-Eingabemaske = Druckansicht. Zellen sind direkt
  beschreibbar.
- **Automatische Summen (Σ):** Bojenberührungen × 5 bzw. Fehlercodes → Punkte
  laut Legende, laufend aufsummiert. Bei Mann-über-Bord/Schikane liegt die
  Σ-Spalte bewusst mittig.
- **Disqualifikation verorten:** Codes A–X in der Disq.-Spalte **oder** direkt in
  einer Tor-Spalte (dokumentiert Ort und Grund).
- **Schnelle Zeiteingabe** über das Numpad: eine Zahl mit Komma/Punkt, Regel
  „> 20 = Sekunden, ≤ 20 = Minuten“; Enter springt weiter; Anzeige normalisiert
  auf `mm:ss,00 (ss,00)`.
- **Parcoursbilder** (SVG) je Klasse auf den Tor-/Parcours-Bögen.
- **QR-Code** je Bogen für die spätere automatische Scanner-Zuordnung
  (Listentyp/Klasse/Lauf).
- **Drei Export-Wege zum Vergleich** (siehe unten): Browser-Druck, Raster-PDF
  (html2canvas + jsPDF) und ein **zweiter Prototyp als echtes Vektor-PDF**
  (`@react-pdf/renderer`, eigene Seite `pdf.html`).
- **Bögen zusammenstellen:** Listentyp, Klasse und Lauf je Bogen wählen,
  sortieren, hinzufügen/entfernen; Startnummern editierbar.

## Bedienung

Links die Steuerleiste (nur am Bildschirm, im Druck ausgeblendet):

1. Veranstaltungsnamen setzen.
2. Unter **Bögen** die gewünschten Listen zusammenstellen (Typ/Klasse/Lauf).
3. In den Bögen rechts die Werte eintragen – Σ und Zeiten aktualisieren sich live.
4. **Drucken / Als PDF (Browser)** oder **PDF herunterladen (JS)**.

## PDF-Export – drei Wege im Vergleich

Es gibt **zwei Einstiegspunkte** (Multi-Page-Build):

| Seite | URL | Ansatz |
| ----- | --- | ------ |
| Haupt-Prototyp | `index.html` | Eingabemaske + **Browser-Druck** (Vektor) & **Raster-Download** |
| Vektor-Prototyp | `pdf.html` | **echtes Vektor-PDF** via `@react-pdf/renderer` |

- **Browser-Druck → „Als PDF speichern"** (empfohlen): scharfer, markierbarer
  Text inkl. QR-Codes. Dateiname wird über `document.title` vorgeschlagen
  (mit Zeitstempel und – falls eindeutig – Position/Klasse/Lauf).
- **Raster-Download** (html2canvas + jsPDF): Ein-Klick-Download, aber gerastert
  (unschärfer). QR-Codes werden dafür als Canvas neu gezeichnet.
- **Vektor-Prototyp** (`pdf.html`): echtes, kleines Vektor-PDF mit Live-Vorschau
  und Ein-Klick-Download. Kopf **und** Spaltenüberschriften wiederholen sich
  zuverlässig auf jeder Seite (react-pdf `fixed`), inkl. Seitenzahlen und
  Vektor-QR. Konfiguriert wird im Haupt-Prototyp (gemeinsamer localStorage);
  die Vergleichsseite dann neu laden. Das Parcoursbild ist hier (noch) nicht
  eingebettet.

Beide Seiten sind über einen Link miteinander verbunden.

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm run build    # Produktions-Build nach dist/
npm run preview  # Build lokal ansehen
```

## Tests

Die Kernlogik (Zeit-Parsing, Punkte-/Disq-Berechnung, QR-Payload) und ein
UI-Render-Smoke-Test sind mit **Vitest** abgedeckt.

```bash
npm test            # alle Tests einmal ausführen
npm run test:watch  # Watch-Modus
npm run check       # Typecheck (tsc) + Tests – auch im pre-commit-Hook
```

Die Tests laufen automatisch **lokal bei jedem Commit** (Git-Hook
`.githooks/pre-commit`, aktiviert durch `npm install` via `prepare`; manuell:
`git config core.hooksPath .githooks`; Notausgang: `git commit --no-verify`) und
**in der CI** (`.github/workflows/ci.yml`) sowie vor jedem Pages-Deploy.

## Deployment auf GitHub Pages

1. Repository auf GitHub anlegen und pushen.
2. **Settings → Pages → Build and deployment → Source** = **GitHub Actions**.
3. Bei jedem Push auf `main` baut und deployt
   [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) nach
   <https://motorbootslalom.github.io/fehlerpunkte-prototyp/>.

Der Vite-`base` ist `./`, daher läuft der Build unter Projekt-Unterpfad **und** lokal.

## Assets

Die Parcoursbilder unter `public/parcours/` stammen aus `../Parcours/dist/`
(Verzeichnisse `alcatraz_I`, `alcatraz_II`, `alcatraz_Parcours`, SVG je Klasse).

## Tech-Stack

React 19 · TypeScript · Vite (Multi-Page) · qrcode-generator (QR) ·
html2canvas + jsPDF (Raster-Variante) · @react-pdf/renderer (Vektor-Prototyp).
Persistenz via localStorage.
