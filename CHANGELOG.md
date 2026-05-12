# Changelog

Alle wesentlichen Änderungen an Pruefai werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

---

## [1.1.0] – 2026-05

### Hinzugefügt
- **CSP-Header und Sicherheits-Header** in `vercel.json` (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS)
- Origin-Allowlist und IP-Rate-Limits für `/api/capture-lead`, `/api/contact-enterprise`, `/api/stripe-checkout`
- Gemeinsames Sicherheitsmodul `api/_lib/security.js` (CORS, Rate-Limit, IP-Erkennung)
- CHANGELOG.md und CONTRIBUTING.md als Projektdokumentation
- `.htmlhintrc` für HTML-Linting
- CI-Workflow (`.github/workflows/ci.yml`) mit drei Jobs: HTML-Lint, JSON-Validierung, API-Unit-Tests
- `lint`- und `test`-Skripte in `package.json`
- **90 API-Unit-Tests** für alle 9 Serverless-Funktionen (node:test, keine externen Abhängigkeiten)
- `SECURITY.md` – Vulnerability-Disclosure-Policy und quartalsweise Betriebs-/Security-Review-Checkliste
- `.github/ISSUE_TEMPLATE/bug_report.yml` und `feature_request.yml` – strukturierte GitHub-Issue-Templates
- `.github/ISSUE_TEMPLATE/config.yml` – disables blank issues, verweist Sicherheitslücken auf E-Mail
- `.github/pull_request_template.md` – PR-Checkliste für alle Beitragende
- `.github/dependabot.yml` – automatische Sicherheitsupdates für npm und GitHub Actions

### Geändert
- **Max-Plan-Limit auf 1'500 Korrekturen/Monat reduziert** (war: 5'000) – sichert die Bruttomarge im Verhältnis zu den Anthropic-API-Kosten. Frontend, API-Limits, Webhook-E-Mail-Vorlagen, AGB und Landing-Seite synchronisiert.
- Service Worker auf `pruefai-v5` aktualisiert (Cache-Bust nach Aufräumarbeiten)
- README.md: Tech-Stack korrigiert (IndexedDB statt Supabase), Plan-Limits aktualisiert

### Entfernt
- Legacy-`supabase/`-Verzeichnis (Schema, RLS, Migration) – nicht mehr verwendet, ersetzt durch IndexedDB
- Supabase-Referenz im Service Worker (`url.hostname.includes('supabase.co')`)
- Legacy-`supabase/`-Einträge in `.gitignore`

### Sicherheit
- Lead-Capture und Enterprise-Kontakt sind jetzt gegen Mail-Spam geschützt (Rate-Limit + Eingabe-Längenbegrenzung)
- Stripe-Checkout prüft den `Referer`-Header gegen die `ALLOWED_ORIGINS`-Liste
- CSP verhindert XSS aus externen Quellen; nur `cdnjs.cloudflare.com` (jsPDF) und `plausible.io` als externe Script-Quellen erlaubt

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
