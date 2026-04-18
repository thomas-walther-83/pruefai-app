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
- `tests/relay.test.mjs` – 16 Unit-Tests für den Foto-Relay-Handler
- `tests/validate-license.test.mjs` – 14 Unit-Tests für den Lizenzvalidierungs-Handler
- `tests/claude.test.mjs` – 10 Unit-Tests für den KI-Proxy-Handler
- `SECURITY.md` – Vulnerability-Disclosure-Policy und quartalsweise Betriebs-/Security-Review-Checkliste
- Modularisierungshinweis in CONTRIBUTING.md (mittelfristiger Architekturplan)

### Geändert
- README.md: Tech-Stack, Setup-Anleitung und Sicherheitshinweise auf den aktuellen Stand (IndexedDB, kein Supabase) aktualisiert

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
