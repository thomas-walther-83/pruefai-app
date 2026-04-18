# Security Policy

## Unterstützte Versionen

Aktuell wird nur die neueste Version auf `main` aktiv gepflegt und mit Sicherheits-Fixes versorgt.

| Version | Unterstützt |
|---------|-------------|
| `main`  | ✅           |
| ältere  | ❌           |

---

## Sicherheitslücken melden

**Bitte öffne für Sicherheitslücken kein öffentliches GitHub-Issue.**

Melde Sicherheitsprobleme direkt per E-Mail an:

**info@pruefai.ch**

Bitte gib dabei an:
- Art und Schwere der Lücke (CVSS-Score, falls bekannt)
- Betroffene Komponente (z.B. `api/claude.js`, `api/validate-license.js`, `index.html`)
- Schritte zur Reproduktion
- Mögliche Auswirkungen (Datenverlust, unberechtigter Zugriff, etc.)

Wir streben an, innerhalb von **5 Werktagen** zu antworten und innerhalb von **30 Tagen** einen Fix bereitzustellen.

---

## Sicherheitsarchitektur

### Datenspeicherung

- **Alle Schüler- und Notendaten** werden ausschliesslich lokal im Browser (IndexedDB) gespeichert.
- **Keine personenbezogenen Daten** werden an unsere Server übertragen.
- Prüfungsscans werden nur für den Korrektur-Request an die Anthropic API weitergeleitet und nicht gespeichert.

### API-Schlüssel und Secrets

| Secret              | Speicherort                  | Zugang                        |
|---------------------|------------------------------|-------------------------------|
| `ANTHROPIC_API_KEY` | Vercel Environment Variables | Nur serverseitig               |
| `STRIPE_SECRET_KEY` | Vercel Environment Variables | Nur serverseitig               |
| `TRIAL_SECRET`      | Vercel Environment Variables | Nur serverseitig               |
| Lizenzkey           | localStorage (Browser)       | Sichtbar für Endnutzer        |

### Rate-Limiting und Missbrauchsschutz

- Unlizenzierte KI-Anfragen: max. **20 Requests/Stunde pro IP** (in-memory, server-seitig)
- Kostenlose Trial-Tokens: max. **3 Korrekturen/Monat** (HMAC-SHA256-signiert, IP+Monat-gebunden)
- Lizenzierte Anfragen: monatliches Limit je nach Plan (50 / 300 / 5'000)

### CORS

- Nur Anfragen von konfigurierten Origins (`ALLOWED_ORIGINS`) werden akzeptiert
- Empfohlen: exakte URL der Produktionsdomäne eintragen

---

## Regelmässiger Betriebs- und Security-Review

Die folgende Checkliste sollte **mindestens einmal pro Quartal** durchgeführt werden:

### KI-API-Flow (api/claude.js)

- [ ] Anthropic API-Modell auf aktuellen Stand prüfen (`claude-haiku-*` etc.)
- [ ] Rate-Limiting-Werte (20 req/h, 3 Trial) auf Angemessenheit prüfen
- [ ] CORS-Origin-Liste aktuell halten
- [ ] Logs auf ungewöhnliche Fehlermuster prüfen (Vercel → Functions → Logs)

### Stripe / Lizenz-Flow (api/validate-license.js, api/stripe-webhook.js)

- [ ] Stripe Webhook-Signatur aktiviert und Secret rotiert prüfen
- [ ] Plan-Limits (`PLAN_LIMITS`) mit aktuellen Produktangeboten abgleichen
- [ ] Stripe Dashboard: ausstehende Webhooks und Fehler prüfen
- [ ] Lizenzkey-Format-Regex auf Konsistenz mit Stripe-Metadaten prüfen
- [ ] Test-Checkout mit allen Plänen (starter, pro, max) ausführen

### Foto-Relay (api/relay.js)

- [ ] TTL (10 min) und maximale Fotos (30) auf Angemessenheit prüfen
- [ ] Maximale Fotogrösse (4.5 MB) prüfen
- [ ] Vercel-Instanz-Logs auf Speicher-Anomalien prüfen (in-memory Store)

### Frontend-Sicherheit (index.html)

- [ ] Content Security Policy (CSP) im `<head>` oder via Vercel-Header prüfen
- [ ] Drittanbieter-CDN-Links (jsPDF, QRCode.js etc.) auf aktuelle Versionen prüfen
- [ ] localStorage-Daten im Browser auf unerwartete Inhalte prüfen

### Dependency-Review

- [ ] Alle npm-Packages (falls vorhanden) auf bekannte CVEs prüfen (`npm audit`)
- [ ] Vercel Functions Node.js-Runtime auf aktuell unterstützte Version prüfen
- [ ] GitHub Actions Workflow-Actions auf aktuelle Versionen pinnen (`@v4` → SHA-Pin)

---

## Bekannte Einschränkungen

- Der in-memory Store in `api/relay.js` resettet bei einem Vercel Cold-Start; das ist beabsichtigt, da Sessions kurz sind (< 10 min).
- Das IP-Rate-Limiting in `api/claude.js` resettet ebenfalls bei Cold-Starts; dies ist als begrenzter Schutz gegen Gelegenheitsmissbrauch konzipiert.
- Für Produktionsumgebungen mit hohem Missbrauchspotenzial wird ein persistentes Rate-Limiting (Redis/KV-Store) empfohlen.
