# Changelog

Alle wesentlichen Änderungen an Pruefai werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

---

## [Unveröffentlicht]

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
