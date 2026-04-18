# Changelog

Alle wesentlichen Änderungen an Pruefai werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

---

## [Unveröffentlicht]

### Hinzugefügt
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
