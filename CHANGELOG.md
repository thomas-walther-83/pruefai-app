# Changelog

Alle wesentlichen Änderungen an Pruefai werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

---

## [Unveröffentlicht]

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
