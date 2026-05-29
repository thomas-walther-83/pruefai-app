# Real-Test-Checkliste — PruefAI

**Stand:** 2026-05-29 · App-Version 1.2.0 · SW-Cache `pruefai-v20`
**Branch:** `claude/dazzling-gauss-1yPV8`

Diese Checkliste deckt die drei offenen „Real-Tests" aus der Übergabe ab:
**Ordner-Speicherung**, **Unsicher-Markierung** und **Rechtsgrundlage-Modal**.
Jeder Schritt nennt das tatsächliche UI-Element, das erwartete Verhalten und
die relevante Code-Stelle (`app.html`), damit ein Fehlschlag schnell
zugeordnet werden kann.

## Vorbereitung

- [ ] App lokal starten: `npm start` (Python-Server auf `http://localhost:8000`)
      oder `npm run serve`. Dann `http://localhost:8000/app.html` öffnen.
- [ ] **Browser-Matrix bereitstellen:**
  - Chromium-basiert (Chrome / Edge / Opera) → File System Access API **wird** unterstützt
  - Safari **und** Firefox → API wird **nicht** unterstützt (Fallback-Pfad testen)
- [ ] Für saubere Erstläufe DevTools → Application → Storage → *Clear site data*
      (löscht IndexedDB **und** localStorage). Das setzt die einmaligen Flags zurück.

**Relevante localStorage-Schlüssel** (zum gezielten Zurücksetzen einzelner Flows):

| Schlüssel | Bedeutung |
|---|---|
| `lernortai_fs_onboarded` | Ordner-Onboarding wurde gezeigt |
| `lernortai_rechtsgrundlage_bestaetigt` | Rechtsgrundlage bestätigt (`'1'`) |

Der gespeicherte Ordner-Handle liegt in einer **separaten** IndexedDB
`pruefai-fs-handles` (nicht im normalen App-Store).

---

## 1 · Ordner-Speicherung (File System Access API)

> Code: `app.html` ~1407–1780 (FS-Logik), ~1185–1203 (Startup/Onboarding-Trigger),
> ~804/845 (Settings- & Onboarding-UI).

### 1A · Chromium — Onboarding & Ordnerwahl
- [ ] Frischer Start (Site-Daten gelöscht): Nach E-Mail-Capture erscheint **~0,8 s
      verzögert** das Modal **„Daten lokal in einem Ordner ablegen"**
      (`#fs-onboarding-modal`).
- [ ] Button **„📁 Ordner wählen"** → System-Ordnerdialog (`showDirectoryPicker`).
- [ ] Ordner bestätigen. Falls bereits Klassen/Schüler/Prüfungen existieren:
      `confirm()`-Dialog **„Bestehende Daten … kopieren?"** erscheint.
  - [ ] *OK* → Toast „Ordner verbunden: … (n Stores, m Dateien übernommen)".
  - [ ] *Abbrechen* → Toast „Ordner verbunden: …" ohne Migration.
- [ ] Im gewählten Ordner liegen jetzt `data/*.json` (klassen, schueler, pruefungen …)
      und ggf. `files/…` (Bilder/PDF). **Per Datei-Explorer prüfen.**
- [ ] Onboarding erscheint nach Abschluss **nicht erneut** (Flag `lernortai_fs_onboarded`).

### 1B · Chromium — Header-Badge (`#fs-status-btn`)
- [ ] **Verbunden:** Ordner-Icon voll sichtbar (Opacity 1), Tooltip
      „Daten werden in Ordner „<Name>" gespiegelt".
- [ ] **Unterstützt, aber nicht verbunden:** Icon sichtbar, aber **gedimmt (Opacity 0,4)**,
      Tooltip „Lokaler Ordner nicht verbunden – klicken zum Verbinden".
- [ ] Klick auf Badge **wenn verbunden** → öffnet Einstellungen.
- [ ] Klick auf Badge **wenn getrennt** → versucht Re-Permission, sonst Onboarding.

### 1C · Chromium — Live-Spiegelung
- [ ] Neue Klasse/Schüler/Prüfung anlegen → nach ~0,5 s (Debounce) wird die
      entsprechende `data/<store>.json` im Ordner aktualisiert.
- [ ] Prüfungsfoto/Unterlage hochladen → erscheint als reguläre Datei unter `files/…`.
- [ ] Datensatz löschen → JSON-Datei wird entsprechend kleiner (Binärdatei via
      `fsDeleteBlob` entfernt).

### 1D · Chromium — Neustart, Permission & Hydrierung
- [ ] Tab schließen, App neu öffnen. Erwartung: Berechtigung ist häufig auf
      „prompt" zurückgefallen → Badge **gedimmt**, **kein** automatischer Re-Sync.
- [ ] Klick auf gedimmtes Badge → Browser-Permission-Prompt → *Zulassen* →
      Toast „Ordner verbunden", Badge voll sichtbar.
- [ ] **Ordner = Wahrheit:** Eine `data/schueler.json` extern bearbeiten (z. B.
      einen Schüler ergänzen) **bevor** die App lädt und die Permission „granted"
      ist → nach Hydrierung erscheint die Änderung in der App. (Hydrierung
      **leert** den IDB-Store und schreibt die Ordner-Daten — IDB-only-Änderungen,
      die nicht im Ordner stehen, gehen dabei verloren. Bewusst so.)

### 1E · Chromium — Einstellungen-Sektion (`#fs-settings-body`)
- [ ] Einstellungen → „📁 Lokaler Ordner für Ihre Daten": zeigt **„✓ Verbunden: <Name>"**.
- [ ] **„🔄 Jetzt komplett sichern"** (`fsManualResync`) → Toast mit Store-/Datei-Anzahl;
      alle Dateien im Ordner aktualisiert.
- [ ] **„✕ Verbindung lösen"** → `confirm()` → bestätigen → Toast „Ordner getrennt",
      Badge gedimmt. Daten bleiben **sowohl im Ordner als auch in der Browser-DB** erhalten.

### 1F · Safari & Firefox — Fallback
- [ ] Badge `#fs-status-btn` ist **ausgeblendet** (API nicht unterstützt).
- [ ] Onboarding-Modal zeigt die Warnung **„Ihr Browser unterstützt die direkte
      Ordner-Speicherung leider nicht"** + Empfehlung Chromium + Hinweis auf
      *Einstellungen → Datensicherung → Exportieren*. Nur Button **„Verstanden"**.
- [ ] Einstellungen-Sektion zeigt den Fallback-Text (browsereigene DB + Chromium-Empfehlung).
- [ ] **Datensicherung** (Einstellungen): „⇩ Exportieren" lädt `pruefai_backup_<datum>.json`;
      „⇧ Importieren" liest die Datei nach `confirm()` wieder ein (überschreibt lokale Daten).

---

## 2 · Unsicher-Markierung

> Code: `app.html` ~3100–3118 (Prompt-Instruktion), ~3245–3295 (Korrektur-Dialog),
> ~3540–3565 (Word-Export). Die KI setzt `"unsicher": true` pro (Teil-)Aufgabe;
> `ki_qualitaet_unsicher` steuert das Badge „Grenzfall".

**Wichtig:** Ob die KI „unsicher" setzt, hängt von der Antwort ab. Um die
Anzeige **zuverlässig** zu testen, eine der folgenden Methoden:
- **Methode A (realistisch):** Ein absichtlich **unleserliches / verwackeltes /
  abgeschnittenes** Prüfungsfoto hochladen und korrigieren lassen.
- **Methode B (deterministisch):** Im DevTools-Network die KI-Antwort mocken
  bzw. eine gespeicherte Korrektur in IndexedDB so editieren, dass mindestens
  eine Aufgabe/Teilaufgabe `"unsicher": true` enthält, dann die Notenansicht öffnen.

### 2A · Korrektur-Dialog (KI-Ergebnis)
- [ ] Oben erscheint die gelbe Hinweisbox **„⚠️ N Stelle(n) … als unsicher markiert …
      Bitte besonders sorgfältig prüfen"** mit korrekter Singular/Plural-Form.
- [ ] Jede unsichere Aufgabe: **gelb hinterlegt** (`#fef3c7`), Warn-Rahmen, Label
      **„⚠️ KI unsicher"** neben der Bezeichnung.
- [ ] Jede unsichere **Teilaufgabe**: gelber Block + Label
      **„⚠️ KI unsicher – bitte manuell prüfen"**.
- [ ] Sichere (Teil-)Aufgaben bleiben **neutral** (kein Gelb, normaler Rahmen).
- [ ] Bei `ki_qualitaet_unsicher === true`: Badge **„⚠️ Grenzfall"** neben dem Schülernamen.

### 2B · Gespeicherte Note (Notenansicht)
- [ ] Nach dem Speichern in der Detail-/Notenansicht bleibt die Unsicher-Markierung
      sichtbar (gleiche Logik, ~3540).

### 2C · Word-Export
- [ ] Korrektur als Word exportieren → über der Tabelle steht die Warnzeile
      **„⚠ N Stellen … gelb hinterlegt"**.
- [ ] Betroffene Tabellenzeilen sind **gelb hinterlegt** (`FEF3C7`), Bezeichnung mit „⚠".
- [ ] Ohne unsichere Stellen: **keine** Warnzeile, **keine** gelben Zeilen.

---

## 3 · Rechtsgrundlage-Modal

> Code: `app.html` ~853–872 (Modal), ~1873–1903 (Trigger & Logik).
> Trigger beim **ersten** Wechsel in die Ansicht **Schüler** oder **Korrektur**,
> solange `lernortai_rechtsgrundlage_bestaetigt !== '1'`.

### 3A · Anzeige & Trigger
- [ ] Frischer Zustand (Flag gelöscht): Wechsel auf **Schüler** *oder* **Korrektur**
      öffnet das Modal **„🔒 Datenschutz – Ihre Verantwortung als Lehrperson"**.
- [ ] Modal enthält **zwei Checkboxen** (Schul-Auftrag/Schulrecht; Namen abdecken /
      Pseudonymisierung) und Links zu `datenschutz.html`, `avv.html`, `subprocessors.html`.
- [ ] Beim Öffnen sind beide Checkboxen **unmarkiert** und „Bestätigen" ist **deaktiviert**.

### 3B · Button-Logik
- [ ] Nur **eine** Checkbox angehakt → „Bestätigen" bleibt **deaktiviert**.
- [ ] **Beide** angehakt → „Bestätigen" wird **aktiv** (`updateRechtsgrundlageButton`).

### 3C · „Später" vs. „Bestätigen"
- [ ] **„Später"** → Modal schließt, **kein** Flag gesetzt → beim nächsten Wechsel auf
      Schüler/Korrektur erscheint es **erneut**, Checkboxen wieder leer.
- [ ] **„Bestätigen"** → Flag `lernortai_rechtsgrundlage_bestaetigt='1'`, Toast
      „Vielen Dank. Bestätigung gespeichert.", Modal schließt.
- [ ] Nach Bestätigung: Modal erscheint **nicht mehr** (auch nach Reload).
- [ ] Cross-Check: Flag in DevTools löschen → Modal triggert wieder.

---

## Ergebnis-Notiz

> Hier Auffälligkeiten / Abweichungen pro Browser eintragen:

- Chrome:
- Edge:
- Safari:
- Firefox:
