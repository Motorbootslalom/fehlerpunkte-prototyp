# Lastenheft - Fehlerpunkte-Eingabemasken (Motorbootslalom)

Version 0.1 · Konzept-Prototyp · Stand 2026-07

Dieses Dokument beschreibt die Anforderungen an die digitalen Eingabemasken
für die Wettkampfrichter-Listen (WKR-Listen) beim Motorboot-/Schlauchboot­slalom.
Es dient der Abstimmung mit den Fachteams und als Grundlage für die spätere
Umsetzung im Auswertungstool. Der beiliegende Prototyp setzt die hier
beschriebenen Punkte beispielhaft um.

---

## 1. Ausgangslage

- Die WKR-Listen werden bisher **mit Excel** erzeugt und als PDF gedruckt
  (siehe Ordner `alte PDF-Listen/`).
- **Großer Vorteil der bisherigen Lösung:** Ausdruck (PDF) und Eingabe erfolgen
  in **derselben Maske/Ansicht**. Dadurch ist eine **Kontrolle der Eingaben
  extrem einfach** - man sieht Formular und eingetragene Werte gleichzeitig.
- Nachteil: Excel ist umständlich, fehleranfällig, nicht scanner-/tabletfähig
  und rechnet Ergebnisse nur eingeschränkt zusammen.

## 2. Ziele

1. **Eingabe = Ausdruck.** Die Bildschirm-Eingabemaske ist optisch identisch mit
   dem gedruckten Bogen (WYSIWYG). Die einfache Kontrollierbarkeit bleibt erhalten.
2. **Automatische Summenbildung.** Fehlerpunkte werden pro Zeile hinten
   zusammengerechnet (Σ-Spalte). Bei Schikane / Mann-über-Bord liegt die
   Ergebnisspalte bewusst **etwas mittig**.
3. **Disqualifikationen verorten.** In den Tor-Spalten können auch
   Disqualifikations-Codes eingetragen werden, damit auf der (nicht zum Prototyp
   gehörenden) Ergebnisseite sichtbar ist, **wo und warum** disqualifiziert wurde.
4. **Druck / PDF.** Die Bögen lassen sich per Knopfdruck als PDF ausgeben und
   drucken.
5. **Scanner-Vorbereitung.** Die Bögen tragen maschinenlesbare Codes (QR), damit
   sie später automatisch der richtigen Position, Klasse und Lauf zugeordnet
   werden können.
6. **Schnelle Zeiteingabe** über das Numpad, robust gegenüber verschiedenen
   Stoppuhr-Anzeigen.

## 3. Aufbau eines Bogens

Jeder Bogen ist eine A4-Seite (Knoten: Querformat) und besteht aus:

- **Kopf:** Veranstaltungstitel, QR-Code, links gestapelt Listentyp / Klasse /
  Lauf, rechts das WKR-Feld (Name/Unterschrift).
- **Tabelle:** eine Zeile je Startnummer (Startreihenfolge), plus einige leere
  Zeilen. Spalten je nach Listentyp (siehe §4).
- **Fuß:** Legende (Fehlercodes mit Punkten, Disqualifikations-Codes A-X),
  ggf. Parcoursbild, Unterschriftszeile „Unterschrift WKR“.

## 4. Listentypen / Positionen (Stationen am Parcours)

> **Konfigurierbar:** Positionen, Spaltenreihenfolge und Fehlerpunkte sind
> datengetrieben (YAML, siehe §12a). Fehlerpunkte/Disqualifikationen kommen aus
> der Ausschreibung (`fehlerpunkte.yaml`, für alle gleich); die Positionen sind
> orts-/personenabhängig (`positionen.yaml`). Die folgende Tabelle beschreibt die
> mitgelieferten Alcatraz-Standard-Positionen.

| Typ | Kopf-Titel | Spalten (nach Nr.) | Σ | Bild |
| --- | ---------- | ------------------ | :-: | :-: |
| Tore 1/3/5 | Tor 1 / 3 / 5 | Start · Tor 1 · Tor 3 · Tor 5 · Tor 3 · Tor 1 · Ziel (je Bojenspalten mit Blickrichtung) · Disq. · Σ | ✓ | alcatraz_I |
| Tore 2/4/5 | Tor 2 / 4 / 5 | analog mit Toren 2/4/5 | ✓ | alcatraz_II |
| Tor 5 | Tor 5 | Fehler · Σ · Disq. · Bemerkung | ✓ | alcatraz_Parcours |
| Mann-über-Bord / Schikane | Mann-über-Bord | Fehler · Fehlerpunkte · **Σ (mittig)** · Disq. · Bemerkung | ✓ | - |
| Steg | Steg | Fehler AB · F-punkte · Fehler AN · F-Punkte · Disq. · Bemerkung | (je Gruppe) | - |
| Zeit | Zeit | Zeit 1 · Zeit 2 · Zeit 3 | - | - |
| Knoten (quer) | Knoten | Webleinstek · Schotstek · Palsteg · Kreuzknoten · Klampe · * · Σ | ✓ | - |
| Parcours einfach | Parcours | Bemerkung · Disq. | - | alcatraz_Parcours |

**Blickrichtungen** an den Tor-Bojenspalten:
`H H` = Hinfahrt Hafen/Links · `H K` = Hinfahrt Kai/Rechts ·
`R H` = Rückfahrt Hafen/Links · `R K` = Rückfahrt Kai/Rechts.

## 5. Fehlerpunkt-Berechnung

- **Bojenspalten (Tore, Knoten):** der WKR trägt die **Punkte direkt** ein
  (5, 10, 15 …), nicht die Anzahl der Berührungen. Beispiel: „10“ an Tor 1 H K
  = 10 Punkte.
- **Fehlercode-Spalten (MüB, Steg, Tor 5):** der WKR trägt die Fehlernummer(n)
  laut Legende ein (kommagetrennt möglich). Die Punkte werden automatisch aus der
  Fehlertabelle summiert und in die zugehörige Punkte-/Σ-Spalte geschrieben.
  Beispiele: MüB „13, 17“ → 10 · Tor 5 „1“ → 20 · Steg „9, 12“ → 20.
- **Σ** = Summe aller Bojen-, Code- und Punktebeiträge einer Zeile, laufend
  aktualisiert.

Fehlertabellen (aus den Alt-Listen übernommen):

- **Tor 5:** 1 = nicht mit gesamter Länge eingefahren (20) · 2 = Durchreißen der
  Schaltung / erst ab Klasse 5 (5).
- **Ablegen (Steg):** 3, 4, 5 = je 5.
- **Anlegen (Steg):** 7, 8, 10, 11 = je 5 · 9, 12 = je 10.
- **Mann-über-Bord:** 13-19 = je 5.
- **Knoten:** 5 pro fehlerhafter Knoten.

## 6. Disqualifikation

- Es gibt eine geltungsweite Code-Tabelle **A-L, X** (auf jedem Bogen als Legende).
- Disqualifikation kann eingetragen werden
  - in der eigenen **Disq.-Spalte** der Zeile **oder**
  - **direkt in einer Tor-/Bojenspalte** (Buchstabe statt Zahl). So ist die
    genaue Stelle dokumentiert (z. B. „G an Tor 3 H H“).
- Für die Ergebnisseite (nicht Teil des Prototyps) stehen damit **Ort und Grund**
  der Disqualifikation strukturiert bereit.
- **Eingabehilfe:** Disq-Eingaben werden automatisch groß geschrieben; es sind
  **nur Codes zulässig, die in der Legende stehen** (A-L, X). Mehrere Codes mit
  Komma und/oder Leerzeichen; die Anzeige normalisiert einheitlich auf „A, B".

## 7. Zeiteingabe

Es existieren verschiedene Stoppuhren: manche zeigen `mm:ss,00`, manche `ss,00`.
Die Eingabe muss **sehr schnell über das Numpad** möglich sein und beide Formate
abdecken.

**Regeln** (eine Zahl mit Trenner - Komma **oder** Punkt, je nach Layout):

- Zahl vor dem Trenner **> 20** → es sind **Sekunden**, danach **Hundertstel**.
  Beispiel `45,67` → 0:45,67.
- Zahl vor dem Trenner **≤ 20** → es sind **Minuten**, danach **Sekunden +
  Hundertstel** (`mm,ssHH`). Beispiel `1,2345` → 1:23,45.
- **Enter** übernimmt und springt ins nächste Zeitfeld.
- Nach Verlassen des Feldes normalisiert die Anzeige auf **`mm:ss,00 (ss,00)`**
  (Uhrzeit- und reine Sekundendarstellung zugleich), z. B. `01:23,45 (83,45)`.

Intern wird jede Zeit als Hundertstelsekunden geführt, damit gerechnet werden kann.

## 7a. Zeilen & Seitenumbruch

- Nach den Startnummern folgt eine **einstellbare Anzahl leerer Zeilen**
  (Standard **3**) für Nachmeldungen.
- **Jede 5. Zeile** ist grau hinterlegt (Lesehilfe).
- Bei vielen Startern bricht die Liste auf **mehrere Seiten** um. **Kopf
  (Titel/Klasse/Lauf/WKR) und Spaltenüberschriften wiederholen sich auf jeder
  Seite** (per Tabellen-`thead`). Die **Fuß-Legende** (`tfoot`) erscheint in
  Firefox auf jeder Seite, in Chrome auf der letzten Seite (Browser-Verhalten).

## 8. Druck / PDF-Export

Zwei Wege sind vorgesehen (im Prototyp beide vorhanden, zum **Vergleich**):

1. **Browser-Druck** (empfohlen): Button löst den Druckdialog aus; exakte
   A4-Print-CSS erzeugt WYSIWYG-Seiten (je Bogen eine Seite, Querformat für
   Knoten). „Als PDF speichern“ läuft über den Druckdialog → scharfer,
   auswählbarer Text, keine Zusatzbibliothek.
2. **JS-Download** (html2canvas + jsPDF): direkter PDF-Download ohne Dialog.
   Nachteil: rasterisierter (nicht auswählbarer) Text. QR-Codes werden als
   Canvas neu gezeichnet, da html2canvas SVG nicht erfasst.
3. **Vektor-Prototyp** (`pdf.html`, `@react-pdf/renderer`): echtes, kleines
   Vektor-PDF mit Live-Vorschau und Ein-Klick-Download; Kopf und
   Spaltenüberschriften wiederholen sich zuverlässig auf jeder Seite, mit
   mittiger Seitenzahl, Vektor-QR, eingebetteter Schrift (korrektes „Σ") und
   eingebettetem Parcoursbild (PNG; Tor-Bögen gedreht). Dient dem Vergleich.

Der Dateiname wird bei Browser-Druck und Vektor-Prototyp automatisch gebildet:
`Fehlerpunkte - <Event> [- <Position>] [- Klasse X] [- N. Lauf] - <Zeitstempel>`,
wobei Position/Klasse/Lauf nur erscheinen, wenn über alle Bögen eindeutig.

## 9. Scanner-Erfassung (spätere Ausbaustufe)

- Jeder Bogen trägt einen **QR-Code** im Kopf. Inhalt (kompakt, scannerfreundlich):
  `FP1;e=<event>;t=<listentyp>;k=<klasse>;l=<lauf>`.
- Damit kann ein eingescannter Bogen automatisch der richtigen **Position
  (Listentyp), Klasse und Lauf** zugeordnet werden.
- Optional später erweiterbar um Bogen-/Seiten-ID und Formmarken für die
  Feld-Erkennung (OMR).

## 10. Startnummern / Verzahnung

- Die Zeilen (Startnummern) ergeben sich aus der **Startreihenfolge** je Klasse.
- Im Prototyp sind Demo-Nummern hinterlegt und editierbar (keine echten Daten).
- Produktiv kommen die Nummern und die Verzahnungs-/Gruppenaufteilung aus dem
  Schwesterprojekt *verzahnungs-prototyp* bzw. dem Auswertungstool.
- Es gibt die Klassen **E und 1-7** (Klasse A entfällt).
- **Jede 5. Zeile** ist grau hinterlegt - reine Lesehilfe zur Orientierung.

## 11. Datenschutz

- Der Prototyp verarbeitet **keine echten personenbezogenen Daten**.
- Alle Eingaben bleiben **lokal im Browser** (localStorage), keine Server-Übertragung.

## 12a. Konfiguration (Positionen & Fehlerpunkte)

- **Trennung der Belange:** Fehlerpunkte/Disqualifikationen (aus der
  **Ausschreibung**, i. d. R. für alle gleich) sind getrennt von den
  **orts-/personenabhängigen Positionen** (z. B. wenige WKR oder Plätze nur von
  einer Seite einsehbar).
- **Zwei YAML-Dateien** unter `public/config/` (zur Laufzeit geladen, ohne Neubau
  änderbar; `src/config/`-Kopien als Fallback):
  - `fehlerpunkte.yaml` - `disqualifikationen` (beliebig viele, mit Buchstaben) und
    benannte `kataloge` (Fehler mit Zahlen → Punkte).
  - `positionen.yaml` - wiederverwendbare `hinweise`, die `positionen`
    (Spalten/Reihenfolge, `katalog`- und `hinweis`-Verweis, `bild`,
    `bildDrehung: 0|90|-90|180`) und die `aufbauten` (Setups).
- **Aufbauten (Setups):** Positionen sind zu Aufbauten gebündelt (z. B. Alcatraz,
  Frontal). Bei einem Wettkampf wird ein Aufbau gewählt; er enthält alle Listen
  (auch Zeit/Knoten). Gemeinsame Listen werden geteilt, nur die Tor-Positionen
  unterscheiden sich je Aufbau (Blickrichtung/Spaltenreihenfolge).
- **Disqualifikationen pro Position ausblendbar** via `disq: alle | keine | [A,…]`.
- **Hinweise** (Bojen-Bezeichnungen) sind zentral und werden per Verweis
  eingebunden; eindeutige Seitennamen (Hafen/Kai/See/Land) statt links/rechts.
- Beide Ausgaben (Eingabe-Prototyp und Vektor-PDF) nutzen dieselbe Konfiguration.

## 12. Nicht-Ziele / offene Punkte

- Ergebnis-/Ranglistenseite (Zusammenführung aller Bögen) ist **nicht** Teil des
  Prototyps.
- Verbindliche Reglement-Feinheiten (welche Fehler ab welcher Klasse zählen,
  Mehrfachwertungen) sind bewusst vereinfacht und mit dem Reglement abzugleichen.
- Rollen/Login, Mehrbenutzer-Synchronisation, Offline-Sync: später.
- Exakte Gruppen-/Verzahnungsschattierung je Klasse: mit Verzahnungstool zu koppeln.
