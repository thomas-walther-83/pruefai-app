# Changelog

Alle wesentlichen Änderungen an Pruefai werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

---

## [Unveröffentlicht]

### Behoben
- **CORS: same-origin zusätzlich erlauben** (`claude`, `validate-license`, `relay`,
  `capture-lead`, `contact-enterprise`). Nach dem Setzen von `ALLOWED_ORIGINS` hätten
  sonst alle Vercel-Preview-Deployments (`*.vercel.app`) bei API-Aufrufen 403 erhalten.
  Same-Origin-Requests (Origin = eigener Host) sind jetzt immer erlaubt – Production und
  Previews funktionieren, echtes Cross-Site bleibt blockiert.

### Sicherheit / Behoben
- **Doppelklick-Schutz für KI-Korrektur**: Einzel- und Batch-Korrektur sind jetzt
  gegen parallele/doppelte Auslösung gesichert (In-Flight-Guard) – verhindert doppelte
  API-Calls und damit doppelte Kosten/Verbrauch. Buttons zeigen währenddessen einen
  Lade-Zustand und sind deaktiviert.
- **XSS in `onclick`-Handlern geschlossen**: Schülernamen und Feedback-Textbausteine
  wurden in Inline-`onclick`-Attribute interpoliert; ein Name/Text mit `'` oder `"`
  konnte aus dem Attribut ausbrechen und Code ausführen. Neuer Encoder `jsAttr()`
  bettet Werte attribut- und JS-sicher ein (verifiziert gegen mehrere Payloads).
- **XSS-Härtung im KI-Qualitätscheck**: Aus der KI-Antwort stammende Werte
  (`note`, `note_vorschlag`) werden nun konsequent escaped, bevor sie ins DOM gehen.
- **Kein Fehler-Leak mehr** (`/api/claude`): interne Fehlermeldungen werden nur noch
  geloggt, der Client erhält eine generische Meldung.
- **Rate-Limiting für `/api/validate-license`**: schützt vor Brute-Force/Enumeration
  von Lizenzschlüsseln und vor Last auf der Stripe-API (30/Stunde/IP).
- **Stripe-Webhook**: Plan-Werte werden gegen eine Whitelist geprüft, bevor sie als
  Kunden-Metadaten gespeichert werden.
- **`/api/admin-revoke`**: zusätzlicher Injection-Schutz – nur UUID-Format wird in die
  Stripe-Suchanfrage übernommen.
- SW-Cache auf `pruefai-v25`, Version 1.5.1.

### Hinzugefügt / Features
- **Klassen-Statistik pro Prüfung**: Die Noten-Ansicht zeigt jetzt Mittelwert,
  **Median**, **Bestehensquote in %** (farbcodiert), Bestanden/benotet, **Streuung (σ)**
  und die **Spannweite** samt **Ausreisser** (tiefste/höchste Note mit Name) – zusätzlich
  zum bestehenden Notenverteilungs-Histogramm.
- **Sammel-PDF „Rückgabe"**: Ein PDF mit einer druckfertigen Seite je korrigierter
  Schülerarbeit (Note, Punkte, Bewertung pro Aufgabe/Teilaufgabe, Kommentar,
  ⚠-Markierung unsicherer Stellen) – zum Austeilen an die Klasse. Button in der
  Noten-Ansicht neben Notenliste-PDF und CSV-Export.
- Notenlisten-PDF-Export auf die neue Teal-Markenfarbe umgestellt.

### Geändert / App-Design (Warm & Menschlich)
- **App-Oberfläche (app.html) auf das warme Design-System umgestellt** – konsistent
  zur Landing Page: Creme-Hintergrund, Teal-Akzent (#0E7C66), warme Tinte & Sand-Töne
  statt Corporate-Blau. Header von blauem auf Teal-Verlauf.
- **Schrift Plus Jakarta Sans** auch in der App (selbst gehostet, im Service-Worker-
  Cache für Offline-Nutzung).
- Notenfarben (1–6) bleiben als semantische Skala erhalten; nur Marken-/Neutral-Töne
  wurden umgestellt. PWA-Manifest (Theme-/Hintergrundfarbe, Icon) angepasst.
- SW-Cache auf `pruefai-v23`, App-Version 1.4.0.

### Geändert / Landing-Page: Produkt-Mockups
- **Zwei Produkt-Einblicke mit fiktiven Daten** in die Landing Page eingebaut
  (CSS-„Screenshots" im Browser-Frame): eine fertige Korrektur (Note, Punkte pro
  Aufgabe, ⚠-Markierung) und eine Klassen-Übersicht mit Status & Schnitt.

### Geändert / Landing-Page Design (Warm & Menschlich)
- **Neues warmes Design-System** für die Landing Page (index.html): Creme-Hintergrund
  (#FBF7F0), Tinte (#1C1B1A), Teal-Akzent (#0E7C66) und Sand-Flächen – statt des
  generischen Corporate-Blaus. Inspiriert von preisgekrönten Education-Apps
  (Apple Design Awards 2025: CapWords, Speechify) und Awwwards-SaaS-Trends.
- **Selbst-gehostete Schrift** „Plus Jakarta Sans" (variabel 200–800, eine 27 KB
  woff2-Datei unter `/fonts/`). CSP-konform (`font-src 'self'`) und ohne externen
  Google-Fonts-Call – passt zur Datenschutz-Positionierung.
- **Hellerer, freundlicher Hero** (warmer Verlauf statt dunkelblauem Block),
  runde Pill-Buttons, Glas-Navigation, sanfte Hover-Lifts auf Karten.
- **SVG-Line-Icons statt Emoji** in Logo, Value-Cards und Trust-Strip.
- Teal-/Warm-Akzente durchgängig in Pricing, Vergleichstabelle, CTA-Banner, Footer
  und Cookie-Banner.

### Behoben
- **Falsche Note in der Einträge-Liste**: Nach der KI-Korrektur zeigte die Liste
  bei allen Schülern die von der KI selbst gemeldete (unzuverlässige) Note – oft
  identisch (z. B. 5.5). Die Note wird jetzt direkt beim Sichern aus den erreichten
  Punkten über die Notenformel der Prüfung berechnet (gleiche Logik wie der
  Prüfen-Dialog) und stimmt damit sofort, ohne vorherige Bestätigung.
- **Pro-Features nach Lizenzeingabe nicht aktiv**: Beim Speichern des Lizenz-
  schlüssels in den Einstellungen wurde der Plan nicht validiert, sodass
  `lernortai_plan` leer blieb und Pro-Features bis zum Neuladen gesperrt waren.
  `saveSettings` validiert die Lizenz jetzt sofort und setzt den Plan.
- **Auto-Aktivierung nach Kauf**: Der „App starten"-Button auf der
  Checkout-Erfolgsseite übergibt den Lizenzschlüssel jetzt via `?activate=`, sodass
  der Plan automatisch übernommen wird (kein manuelles Kopieren mehr nötig).
- SW-Cache auf `pruefai-v22`, App-Version 1.3.1.

### Geändert / Prüfungsdialog (UX)
- **Direkt-Upload im „Neue Prüfung"-Dialog**: Vorlagenprüfung, Musterlösung und
  weitere Unterlagen lassen sich jetzt direkt im Dialog hochladen – ohne die
  Prüfung vorher speichern zu müssen. Die Dateien werden gepuffert und beim
  „Speichern" angehängt; die verwirrende „zuerst speichern"-Hinweisbox entfällt.
- **Punkteschema-Analyse vor dem Speichern**: „Punkteschema analysieren" liest
  die soeben hochgeladene Vorlage direkt und übernimmt Max-Punkte automatisch.
- **Unterlagen als Hauptweg**: Der Upload-Bereich steht jetzt oben und ist
  hervorgehoben; der Hinweis macht klar, dass die KI Aufgaben und Punkte aus der
  Vorlage erkennt (kein manuelles Eintippen nötig).
- **„Erweitert (optional)" eingeklappt**: Max-Punkte (manuell), Bewertungsraster
  und zusätzliche KI-Anweisungen sind in einen aufklappbaren Bereich gewandert
  und mit Kurzerklärungen versehen. Ohne angelegtes Raster erscheint statt eines
  leeren Dropdowns ein Hinweis mit Link „Raster erstellen".
- SW-Cache auf `pruefai-v21`, App-Version 1.3.0.

### Geändert / KI-Korrektur
- **Sorgfaltsregeln im KI-Prompt verschärft**: Die KI ist explizit angewiesen,
  keine Vermutungen anzustellen, Unklarheiten und unleserliche Stellen offen
  zuzugeben und für solche Stellen das neue Feld `unsicher: true` zu setzen.
- **Sichtbare ⚠-Markierung im Ergebnis-Dialog**: Banner oben mit Anzahl
  unsicherer Stellen; betroffene (Teil-)Aufgaben werden gelb hinterlegt und
  mit „KI unsicher – bitte manuell prüfen" gekennzeichnet.
- **Word-Export**: Hinweistext mit Gesamtzahl unsicherer Stellen; betroffene
  Tabellenzeilen mit gelbem Hintergrund und „⚠ unsicher"-Markierung. Die
  Lehrperson erkennt die Stellen sofort.
- SW-Cache auf `pruefai-v20`.

### Hinzugefügt / Datenschutz (P1)
- **Interne Compliance-Dokumente** im Repo (Quellen):
  - `docs/compliance/dpa-checklist.md` – Status der DPAs/AVVs mit allen
    Sub-Auftragsbearbeitern und konkrete nächste Schritte zur Komplettierung.
  - `docs/compliance/meldeplan.md` – Internes Runbook für Datenschutz-
    verletzungen (Art. 24 nDSG / 72-Stunden-Frist EDÖB).
- **Datenschutzerklärung 7.1–7.4**: konkreter E-Mail-Prozess für Auskunft,
  Datenübertragbarkeit und Löschung mit 30-Tage-Bearbeitungsfrist; klare
  Beschreibung, was auf Anfrage geliefert / gelöscht wird (lokale Daten
  beim Kunden, Anbieter-/Stripe-Customer-Daten, Sub-Auftragsbearbeiter).
- **Datenschutzerklärung Abschnitt 9** ergänzt um Meldepflicht bei
  Datenpannen samt internem Runbook-Verweis.
- **AGB aktualisiert**: Pseudonymisierung explizit in §2.3, AVV-Akzeptanz
  durch AGB-Annahme in §7, Sub-Bearbeiter-Übersicht verlinkt; §5.4 und
  §8.3 spiegeln die neue lokale Ordner-Speicherung als Sicherungsoption.

### Hinzugefügt
- **Lokaler Ordner als persistente Datenablage** (File System Access API):
  Auf Chromium-basierten Browsern (Chrome / Edge / Opera) kann ein lokaler
  Ordner gewählt werden, in dem PruefAI alle Daten ablegt — Klassen, Schüler,
  Prüfungen, Noten als JSON-Dateien, Prüfungsfotos und Lernunterlagen als
  reguläre Bild-/PDF-Dateien. Spiegelung läuft debounced automatisch nach
  jeder Änderung. Liegt der Ordner in iCloud Drive / Dropbox / OneDrive,
  ergibt sich Geräte-übergreifende Synchronisation ohne eigene Cloud.
- **Onboarding-Modal beim ersten Start**: Wählen-Sie-einen-Ordner-Aufforderung
  (Chromium) bzw. klarer Hinweis, dass für die optimale Datenablage ein
  Chromium-basierter Browser empfohlen wird (Safari/Firefox).
- **Header-Status-Symbol**: zeigt den verbundenen Ordner bzw. lädt zum
  Verbinden ein. Bei jedem Sitzungsstart wird auf den gespeicherten
  Ordner-Zugriff still re-permissioniert; bei verweigerter Berechtigung
  führt ein Klick zum Modal.
- **Migration**: Beim ersten Verbinden eines Ordners können bestehende
  IndexedDB-Daten optional in den neuen Ordner übernommen werden.
- **Settings-Sektion „Lokaler Ordner"**: Status, manuelle Komplett-
  Synchronisation und Verbindung lösen.

### Korrigiert / Datenschutz
- **Jahreszahlen aktualisiert**: Footer-Copyright (© 2025 → © 2026),
  „Stand Januar 2025" → „Stand Mai 2026", DSFA- und
  Bearbeitungsverzeichnis-Überprüfungsdatum auf 2026-05-28.
- **Story-Schluss konsistent**: „Samstagnachmittag" → „Sonntagabend"
  (passt zum durchgängigen Zeit-zurück-Faden Hero/Value-Card/CTA).
- **Rechtsgrundlage-Bestätigung präzisiert**: App-Modal, DSFA und
  Bearbeitungsverzeichnis stellen klar, dass die normale Notenerfassung
  durch das kantonale Schulrecht / den Schul-Auftrag legitimiert ist
  (analog zu Excel oder Schul-LIS) und eine separate Einwilligung der
  Erziehungsberechtigten üblicherweise nicht erforderlich ist.

### Hinzugefügt / Datenschutz (P1)
- **Drei öffentliche Compliance-Seiten** verlinkt aus Datenschutzerklärung
  und Footer:
  - `/subprocessors` – vollständige Sub-Auftragsbearbeiter-Übersicht mit
    Standort, Funktion und Drittland-Grundlage (Anthropic, Stripe, Vercel,
    Upstash, Resend).
  - `/bearbeitungsverzeichnis` – nach Art. 12 nDSG / Art. 30 DSGVO mit den
    vier Bearbeitungstätigkeiten (KI-Korrektur, Abo, E-Mails, Hosting).
  - `/dsfa` – Datenschutz-Folgenabschätzung für die KI-Korrektur mit
    Risikoanalyse, Massnahmen und Restrisiko-Beurteilung.
  - Markdown-Quellen in `docs/compliance/`.
- **App-seitige Rechtsgrundlage-Bestätigung**: Bei erstem Besuch der
  Schüler- oder Korrektur-Ansicht erscheint einmalig ein Dialog. Die
  Lehrperson bestätigt, dass eine gültige Rechtsgrundlage (Schul-Auftrag /
  Einwilligung) besteht und sie die Empfehlung kennt, Schülernamen vor
  dem Foto abzudecken. Bestätigung wird lokal gespeichert.

### Geändert / Datenschutz
- **Pseudonymisierung an die KI**: Der Schülername wird nicht mehr als
  Klartext im KI-Prompt an Anthropic übertragen. Anthropic erhält nur die
  Prüfungsbilder selbst, ohne identifizierende Metadaten. Der Bericht im
  Ergebnis-Dialog und im Word-Export setzt den Namen lokal im Browser wieder
  ein.
- **Datenschutz-Tipp im Upload-Dialog**: Hinweis, einen oben aufs Blatt
  geschriebenen Namen vor dem Foto abzudecken.
- **Datenschutzerklärung erweitert**: Upstash (temporärer Foto-Relay vom
  Handy, 10 Min TTL) und Resend (transaktionale E-Mails) als
  Sub-Auftragsbearbeiter ergänzt; Drittland-Grundlage präzisiert (SCCs +
  Swiss-U.S. Data Privacy Framework).
- **FAQ korrigiert**: Die Aussage „anonymisierte Prüfungsbilder" wurde durch
  eine ehrliche Beschreibung der Pseudonymisierung ersetzt.

### Hinzugefügt
- **Faire 12-Seiten-Regel im Verbrauch**: Eine Korrektur ist nun eine
  Schülerarbeit mit bis zu 12 Seiten. Längere Arbeiten zählen anteilig
  (ceil(Seiten/12)) – im Server (`/api/claude`) für Lizenz- und Trial-Pfad,
  in der App mit Bestätigungsdialog vor dem KI-Lauf bei mehr als einer
  Einheit und einem Toast mit Seitenzahl/Einheiten. Die Regel ist auch in
  der FAQ dokumentiert.
- **Filter & Sortierung in den Verwaltungslisten**: Klassen, Schüler, Fächer
  und Prüfungen haben jetzt eine einheitliche Werkzeugleiste mit Suchfeld und
  Sortier-Auswahl. Die Prüfungsliste lässt sich zusätzlich nach Fach filtern.
- **Strukturierte Unterlagen pro Prüfung**: Vorlagenprüfung, Musterlösung und
  weitere Unterlagen werden jetzt direkt im Prüfungs-Dialog verwaltet – mit
  Checkliste, die zeigt, was vorhanden ist und was noch fehlt
  (Vorlagenprüfung = Pflicht, Musterlösung = empfohlen, Material = optional).
  In der Prüfungsliste zeigt eine neue Spalte „Unterlagen" den Stand auf einen
  Blick. Das eigenständige Menü „Lernstoff" entfällt dafür.
- **Punkteschema aus der Vorlagenprüfung**: Der Knopf „Punkteschema
  analysieren" lässt die KI die hochgeladene leere Prüfung lesen und Aufgaben,
  Teilaufgaben, Maximalpunkte und – falls erkennbar – die Punktevergabe-Logik
  extrahieren. Die Max-Punkte werden automatisch übernommen; fehlt eine
  Vorlagenprüfung, weist die App darauf hin. Das Schema fliesst auch als
  verbindliche Vorgabe in die KI-Korrektur ein.
- **Feinere, nachvollziehbare Korrektur-Berichte**: Die KI gliedert jede
  Prüfung jetzt in Aufgaben **und Teilaufgaben** auf. Pro (Teil-)Aufgabe wird
  klar gezeigt, **wofür es Punkte gibt** (Begründung) und **was für mehr Punkte
  nötig gewesen wäre** (Verbesserung). Der Ergebnis-Dialog stellt das
  strukturiert und bearbeitbar dar; der Word-Export gibt es als übersichtliche
  Tabelle (Aufgabe/Teilaufgabe · Punkte · Begründung · Verbesserung) aus.
  Bestehende Korrekturen ohne Teilaufgaben werden weiterhin korrekt angezeigt.
- **Word-Export der Korrektur (.docx)**: Im KI-Ergebnis-Dialog erzeugt der
  Knopf „Word herunterladen" pro Schüler ein sauber gegliedertes Word-Dokument
  (Prüfung, Schüler, Ergebnis, Bewertung pro Aufgabe, Gesamtkommentar). Der
  `.docx`-Generator ist vollständig in die App eingebaut – keine externe
  Bibliothek, funktioniert auch offline.
- **Lesbareres KI-Ergebnis**: Die Aufgaben werden im Korrektur-Dialog nicht
  mehr in einer engen Tabelle, sondern als übersichtliche Blöcke mit
  vollbreitem Feedback-Feld dargestellt.
- **Prüfungsseiten verwalten**: Der „Upload"-Dialog zeigt jetzt die bereits
  hochgeladenen Blätter als Vorschau. Einzelne Seiten lassen sich löschen,
  weitere ergänzen; neue Seiten werden korrekt hinter den bestehenden
  nummeriert. In der Korrektur-Übersicht zeigt eine neue Spalte „Seiten" die
  Seitenzahl pro Schüler, und der KI-Knopf ist deaktiviert, solange keine
  Seiten vorhanden sind.

### Behoben
- **KI-Korrektur scheiterte grundsätzlich mit „Load failed"** (eigentliche
  Ursache von Bug #6). Die Prüfungsbilder liegen in IndexedDB und wurden über
  eine `blob:`-URL per `fetch()` wieder eingelesen. Die Content-Security-Policy
  erlaubt `blob:` aber nur fürs Anzeigen (`img-src`), nicht für `connect-src` –
  Safari blockierte den `fetch()` daher hart, noch bevor überhaupt etwas an die
  KI ging. Behoben: Prüfungsbilder werden jetzt direkt aus IndexedDB gelesen
  und Backup-Dateien lokal dekodiert – ganz ohne `fetch()` auf `blob:`/`data:`-
  URLs. Die strikte Content-Security-Policy (`connect-src 'self'`) bleibt damit
  unverändert.
- **KI-Korrektur scheiterte weiterhin bei vielen Prüfungsseiten** („KI-Fehler:
  load failed"). Die fixe Komprimierung auf 1240 px reichte für ~12 Seiten
  nicht – die Anfrage überschritt Vercels hartes 4,5-MB-Limit. Neu wird die
  Auflösung an die Seitenzahl angepasst und die Gesamtgrösse gemessen und bei
  Bedarf stufenweise weiter verkleinert (Budget 2,4 MB Prüfung + 1,7 MB
  Material). Das Funktions-Timeout ist nun zusätzlich in `vercel.json`
  verankert (`maxDuration` 60 s), und `max_tokens` der Korrektur wurde auf
  4096 erhöht, damit auch umfangreiche Prüfungen nicht abgeschnitten werden.

### Hinzugefügt
- **Bearbeitbare Korrektur-Bestätigung**: Nach der KI-Korrektur kann der Lehrer
  die Punkte und das Feedback pro Aufgabe direkt überschreiben. Die Punktsumme
  und die Note werden dabei live neu berechnet; die Note bleibt zusätzlich
  manuell anpassbar. Ein Schritt „Bestätigen & abschliessen" schliesst die
  Korrektur ab. Bereits korrigierte Prüfungen lassen sich über die neue
  Schaltfläche „Prüfen" erneut öffnen – damit funktioniert auch „Alle
  korrigieren" sauber (Ergebnisse werden sofort gesichert und einzeln geprüft).
- **Notenformel & -rundung pro Prüfung**: Im Prüfungs-Dialog wählbar – lineare
  Formel oder Knick-Formel mit Bestehensgrenze 60 % bzw. 50 %, Rundung auf
  0.5/0.25/0.1. Die zuletzt gewählte Einstellung dient neuen Prüfungen als
  Vorgabe.
- **Musterlösung & Lernstoff fliessen in die KI-Korrektur ein**: Lernmaterial
  lässt sich beim Upload als „Musterlösung" markieren (neue Checkbox). Bei der
  KI-Korrektur werden die der Prüfung zugeordneten Unterlagen mitgeschickt –
  gewichtet nach Priorität 1 Musterlösung, 2 Unterrichtsmaterial,
  3 Allgemeinwissen. PDF- und Bilddateien werden direkt verarbeitet. Das pro
  Prüfung identische Material wird per Prompt-Caching nur einmal berechnet,
  sodass auch „Alle korrigieren" bezahlbar bleibt.
- **Lernstoff-Massenupload**: Im Dialog „Material hochladen" lassen sich jetzt
  mehrere Dateien gleichzeitig auswählen und in einem Durchgang hochladen.
  Eine Fortschrittsanzeige zählt die Dateien durch; schlägt eine Datei fehl,
  laufen die übrigen weiter.
- **Frontend-Smoke-Tests (Playwright)**: 14 End-to-End-Tests in `tests/e2e/`
  decken Landing-Page, Cookie-Banner, App-Shell und das Routing ab. Ein
  schlanker Vercel-Routing-Emulator (`tests/e2e/static-server.mjs`) spielt
  die `vercel.json`-Reihenfolge (redirects → Dateisystem → rewrites) durch,
  sodass Routing-Bugs wie in PR #45 / #50 künftig vor dem Merge auffallen.
  Neuer CI-Job „Frontend-Smoke-Tests" und npm-Skript `test:e2e`.

### Geändert
- **Lernstoff-Upload vereinfacht**: Das Feld „Bezeichnung" ist jetzt optional –
  bleibt es leer, wird automatisch der Dateiname übernommen (bei
  Mehrfach-Uploads ohnehin pro Datei). Der Upload-Dialog weist zudem darauf
  hin, PowerPoint-Präsentationen als PDF zu exportieren, damit die
  KI-Korrektur sie auswerten kann.

### Entfernt
- **Plausible-Analytics komplett entfernt**: Das Snippet auf der Landing-Page
  war wirkungslos, da für `pruefai.ch` kein Plausible-Konto existiert. Der
  Fremd-Request entfällt, und `plausible.io` wurde aus der Content-Security-
  Policy (`script-src`, `connect-src`) gestrichen.

### Behoben
- **KI-Korrektur scheiterte bei mehreren Prüfungsseiten** („KI-Fehler: load
  failed"). Ursache: `/api/claude` hatte kein Funktions-Timeout und die
  Base64-Bilder sprengten Vercels Body-Limit. Behoben durch `maxDuration=60`
  und ein höheres Body-Limit in `api/claude.js` sowie clientseitige
  Bild-Komprimierung (max. 1240 px) vor jedem KI-Aufruf. SW-Cache auf
  `pruefai-v7` gebumpt, damit Bestandsnutzer die korrigierte `app.html`
  erhalten.
- **QR-Code-Foto-Relay (Handy → PC) verlor Fotos**. Der Relay nutzte einen
  In-Memory-Speicher; da der Foto-Upload des Handys und das Abrufen am PC
  auf getrennten, zustandslosen Serverless-Instanzen landen, kamen die Fotos
  oft nie an. `api/relay.js` speichert die Fotos jetzt in Upstash Redis
  (Vercel-Storage) und reicht sie zuverlässig weiter. Handy-Fotos werden
  zudem kompakter komprimiert (1280 px). SW-Cache auf `pruefai-v9` gebumpt.
  Hinweis: erfordert die neuen Umgebungsvariablen `KV_REST_API_URL` und
  `KV_REST_API_TOKEN` (siehe `.env.example`).

---

## [1.2.0] – 2026-05-20

### Hinzugefügt
- **Marketing-Senior-Agent** (`.claude/agents/marketing-senior.md`) plus
  `docs/marketing-plan.md`: wiederverwendbarer Growth-/Conversion-Audit-Agent
  mit priorisierten Quick Wins für Landing-Page, SEO und Pricing.
- **SEO-Foundation**: `robots.txt`, `sitemap.xml`, JSON-LD-Structured-Data,
  Canonical-Tags und überarbeitete Meta-/OpenGraph-Tags auf der Landing-Page.
- **Auto-Aktivierung der Lizenz** via `?activate=<UUID>`-URL in der
  Willkommens-Mail — Ein-Klick-Onboarding ohne manuelles Key-Einfügen.

### Geändert
- **Landing-Page-Rewrite**: neuer Hero, Trust-Strip, Founder-Section und
  geschärfte Pricing-Darstellung.
- **Datei-Struktur umgestellt**: die Landing-Page ist jetzt `index.html`
  (Startseite `/`), die App `app.html` (`/app`). `/app`-Aufrufe werden per
  Rewrite auf `app.html` geführt, `?activate=`/`?mode=`-Aufrufe auf `/`
  per Redirect auf `/app`.
- **`vercel-deploy.yml` deployt automatisch bei Push auf `main`** (vorher
  nur manueller `workflow_dispatch`). `paths-ignore` überspringt reine
  Doku-Änderungen, eine `concurrency`-Group verhindert überlappende
  Production-Deploys.
- Sämtliches „DSGVO"-Wording durch das schweizerische **„nDSG"** ersetzt.
- `sw.js`: Cache-Bust auf `pruefai-v6`, App-Shell auf `app.html` umgestellt.

### Behoben
- **`pruefai.ch` zeigt jetzt die Landing-Page statt der App.** Ursache war
  Vercels Routing-Reihenfolge: existierende Dateien werden vor `rewrites`
  ausgeliefert, daher griff die Regel `/ → landing.html` nie und `/` zeigte
  immer die `index.html` (= App). Behoben durch Umbenennen (`landing.html`
  → `index.html`, App → `app.html`) statt eines Rewrites.
- **Cookie-Banner auf der Landing-Page liess sich nicht schliessen**: der
  Banner steuerte die Sichtbarkeit über die CSS-Klasse `hidden`, die nie
  definiert war. Steuerung jetzt direkt über `style.display`.

### Sicherheit (Lizenz-Härtung Phase 1)
- **Webhook-Idempotenz** für `checkout.session.completed`: Stripe-Doppelzustellungen erzeugen
  keine zweite Lizenz mehr und schicken keine doppelte Willkommens-Mail. Implementiert
  durch Speichern der `last_checkout_session_id` auf dem Customer-Metadata.
- **Lizenz-Revocation-Flag** (`metadata.revoked='true'`) in `api/claude.js` +
  `api/validate-license.js`: gesperrte Keys werden vor jeder KI-Korrektur abgelehnt
  (Code `license_revoked`).
- **Neuer Admin-Endpoint** `api/admin-revoke.js`: per `X-Admin-Token`-Header geschützt,
  `POST /api/admin-revoke` mit `{license_key, reason}` setzt das Revocation-Flag.
  `action: 'restore'` macht es rückgängig.
- 13 neue Tests (Idempotency, Revocation auf claude.js / validate-license.js, Admin-Auth, Stripe-Integration).
- `ADMIN_TOKEN`-Variable in `.env.example` dokumentiert.

### Automation
- **`Stripe Bootstrap`-Workflow synct die Price-IDs + Webhook-Secret jetzt
  automatisch in die Vercel-Env-Vars** und triggert ein Vercel-Redeploy.
  Reduziert den Stripe-Sync-Aufwand auf einen einzigen Klick in GitHub
  Actions — kein manuelles Copy-Paste in der Vercel-UI mehr.
- `scripts/sync-vercel-env.mjs`: upsert von Env-Vars via Vercel REST API
  (`v9` PATCH / `v10` POST mit `upsert`), idempotent, leere Werte
  oder `<unchanged>` werden übersprungen.
- `setup-stripe.yml`: 2 neue Steps (Sync + Redeploy via `vercel-cli`) +
  Job-Summary mit den extrahierten IDs.

### Domain & Mail
- `docs/domain-setup.md`: vollständige Anleitung für CAA-Record, Resend-Domain-
  Verifikation (SPF + DKIM auf `send.pruefai.ch`), **Zoho Mail** (Apex-MX,
  -SPF und -DKIM für `info@pruefai.ch`), DMARC-Policy mit gestaffeltem
  Rollout (`none` → `quarantine` → `reject`) sowie Submission-Links für
  SmartScreen / Safe Browsing / Talos / BrightCloud.
- `scripts/check-dns.mjs`: idempotenter DNS-Verifizierer, prüft alle
  Pflicht- und optionalen Records via `node:dns`, druckt Checkliste mit
  konkretem Fix-Vorschlag bei Lücken. Neu mit **Zoho-Checks** (Apex-MX,
  Apex-SPF mit Zoho-Include, Zoho-DKIM).
- `.github/workflows/check-dns.yml`: täglicher Cron + `workflow_dispatch`.
  Schlägt fehl wenn ein Pflicht-Record verschwindet — frühe Warnung bei
  versehentlichen Cyon-DNS-Änderungen.

### Sicherheit
- **Server-seitiges Pro-Feature-Gating** (`api/claude.js`): Frontend sendet ein `feature`-Feld
  (`correction`, `correction_pro`, `quality_check`, `help_chat`), Server prüft gegen
  Plan-Mapping. Lokal manipulierter `localStorage` reicht damit nicht mehr aus, um
  Pro-Features (Rubric / KI-Profil / Qualitätscheck) zu nutzen — der Server lehnt
  Anfragen mit `feature_not_in_plan` (402) bzw. `feature_not_in_trial` (402) ab.
- 5 neue Unit-Tests in `tests/claude.test.mjs` decken alle Gating-Pfade ab.

---

## [1.1.0] – 2026-05-12

### Geändert
- **Max-Plan-Limit von 5'000 auf 1'500 Korrekturen/Monat reduziert** (Marge-Schutz). Betrifft `api/claude.js`, `api/validate-license.js`, `api/stripe-webhook.js` sowie alle kundenseitigen Texte (`landing.html`, `index.html`, `agb.html`, `README.md`, `SECURITY.md`).
- `sw.js`: Cache-Bust auf `pruefai-v5`, toten Supabase-Filter entfernt.
- README/Projektstruktur: Verweis auf `supabase/` entfernt.

### Sicherheit
- **Content-Security-Policy** und Security-Header (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, `HSTS`) in `vercel.json` hinzugefügt.
- `api/capture-lead.js`, `api/contact-enterprise.js`: Origin-Allowlist (`ALLOWED_ORIGINS`), CORS-Preflight, IP-basiertes Rate-Limit (20 bzw. 10 Requests/Stunde).
- `api/stripe-checkout.js`: Referer-Allowlist und IP-Rate-Limit (30 Requests/Stunde) gegen Stripe-Session-Spam von Drittseiten.
- `api/claude.js`: License-Key- und Schul-Code-Format vor dem Stripe-Lookup validieren (spart Stripe-Calls und blockt Probing).

### Entfernt
- `supabase/`-Legacy-Ordner (Schema, RLS-Policies, Migration) – Projekt nutzt seit 1.0 ausschliesslich IndexedDB.

---

## [1.0.1] – 2026-04-19

### Behoben
- Stripe-Checkout: `invoice_creation`-Parameter wird im Subscription-Mode nicht mehr gesendet (war vom Stripe-API abgelehnt).
- Statisches Hosting: Extensionless-Routen-Fallbacks und host-agnostische interne Links (PWA-Assets, Navigation).
- Initiales Rendering: Externe Head-Skripte werden deferred geladen, damit kein leeres Erstpaint mehr auftritt.
- `qrcode`-Library lokal gebundelt (kein externer CDN-Fetch mehr).
- SRI-Hashes zu deferred cdnjs-Skripten ergänzt.

---

## [Vorgängerversionen]

### Hinzugefügt (vor 1.1.0)
- CHANGELOG.md und CONTRIBUTING.md als Projektdokumentation
- `.htmlhintrc` für HTML-Linting
- CI-Workflow (`.github/workflows/ci.yml`) mit drei Jobs: HTML-Lint, JSON-Validierung, API-Unit-Tests
- `lint`- und `test`-Skripte in `package.json`
- **90 API-Unit-Tests** für alle 9 Serverless-Funktionen (node:test, keine externen Abhängigkeiten):
  - `tests/relay.test.mjs` (16), `tests/validate-license.test.mjs` (14), `tests/claude.test.mjs` (10)
  - `tests/stripe-webhook.test.mjs` (12), `tests/stripe-checkout.test.mjs` (10)
  - `tests/stripe-portal.test.mjs` (8), `tests/get-license.test.mjs` (8)
  - `tests/capture-lead.test.mjs` (7), `tests/contact-enterprise.test.mjs` (5)
- `SECURITY.md` – Vulnerability-Disclosure-Policy und quartalsweise Betriebs-/Security-Review-Checkliste
- Modularisierungshinweis in CONTRIBUTING.md (mittelfristiger Architekturplan)
- `.github/ISSUE_TEMPLATE/bug_report.yml` und `feature_request.yml` – strukturierte GitHub-Issue-Templates
- `.github/ISSUE_TEMPLATE/config.yml` – disables blank issues, verweist Sicherheitslücken auf E-Mail
- `.github/pull_request_template.md` – PR-Checkliste für alle Beitragende
- `.github/dependabot.yml` – automatische Sicherheitsupdates für npm und GitHub Actions

### Geändert
- README.md: Tech-Stack korrigiert (IndexedDB statt Supabase), Plan-Limits (50/300/5'000) verifiziert

---

## [1.0.0] – 2025

### Hinzugefügt
- Grundlegende KI-Korrektur via Anthropic Claude API
- Datenspeicherung vollständig lokal in IndexedDB (kein Cloud-Backend)
- QR-Code-Foto-Relay für mobilen Kamera-Upload
- Stripe-Lizenzierung (Starter / Pro / Max)
- PWA-Support (Service Worker, Manifest)
- Bewertungsraster (Rubrics) und Textbausteine
- Analytik-Dashboard für Pro-Plan (klassenweite Trends, Fehlerkatalog)
- Multi-Schultyp-Support (Berufsschule, Gymnasium, Mittelschule, Primarschule, Sekundarschule, Hochschule)
- Export/Import aller Daten als JSON
- PDF-Export für Notenlisten und Korrekturen
- Schweizer Notensystem (1.0–6.0, Bestehensgrenze 4.0)
