# Bearbeitungsverzeichnis PruefAI

Nach Art. 12 nDSG / Art. 30 DSGVO · Stand 2025-05-28 · Quelle für die öffentliche Seite [/bearbeitungsverzeichnis](https://pruefai.ch/bearbeitungsverzeichnis).

## Verantwortliche/r

Thomas Walther, PruefAI, Schweiz · info@pruefai.ch

## Rollen

- **Verantwortliche/r für Lehrer- und Kundendaten:** PruefAI
- **Auftragsbearbeiterin für Schülerdaten:** PruefAI im Auftrag der jeweiligen Lehrperson/Schule
- **Sub-Auftragsbearbeiter:** siehe `subprocessors.md`

## 1. KI-gestützte Korrektur handschriftlicher Prüfungen

| Feld | Inhalt |
|---|---|
| **Zweck** | Automatisierte Korrektur und Bewertung handschriftlicher Schülerprüfungen als Unterstützung der Lehrperson (Mensch-im-Loop). |
| **Rechtsgrundlage** | Auftragsverhältnis mit der Lehrperson/Schule (Art. 9 nDSG / Art. 28 DSGVO). Die Lehrperson/Schule trägt die ursprüngliche Rechtsgrundlage. |
| **Betroffene Personen** | Schülerinnen und Schüler (überwiegend Minderjährige), Lehrpersonen |
| **Personendatenkategorien** | Schülernamen (lokal), Prüfungsbilder, Notenpunkte, Korrekturkommentare |
| **Pseudonymisierung** | Vor jeder KI-Übermittlung werden Schülernamen entfernt; an die KI gehen nur Bild und Prüfungsmetadaten. |
| **Empfänger** | Anthropic PBC (KI); Upstash Inc. (temporärer QR-Foto-Relay) |
| **Aufbewahrung** | Lokal im Browser bis manuelle Löschung; bei Anthropic nicht persistiert; bei Upstash TTL 10 Min |
| **Drittstaaten** | USA – SCCs + Swiss-U.S. DPF |
| **TOMs** | TLS, IndexedDB statt zentrales Backend, Bild-Komprimierung, Pseudonymisierung, Lizenz-Validierung, CSP, Rate-Limit, AVVs mit allen Sub-Bearbeitern |

## 2. Abonnement- und Lizenzverwaltung

| Feld | Inhalt |
|---|---|
| **Zweck** | Abschluss/Verwaltung kostenpflichtiger Abonnements, Rechnungsstellung, Kontingent-Tracking |
| **Rechtsgrundlage** | Vertragserfüllung (Art. 31 Abs. 2 lit. a nDSG / Art. 6 Abs. 1 lit. b DSGVO) |
| **Betroffene Personen** | Lehrpersonen |
| **Personendatenkategorien** | E-Mail, Zahlungsdaten (via Stripe), Lizenzschlüssel, Plan, Kontingent |
| **Empfänger** | Stripe Payments Europe Ltd. |
| **Aufbewahrung** | Vertragsdauer + 10 Jahre (Art. 958f OR) |
| **Drittstaaten** | Keine – Stripe in Irland (EU, adäquat) |
| **TOMs** | Stripe PCI-DSS-konform, HMAC-SHA256-Tokens, HTTPS |

## 3. Versand transaktionaler E-Mails

| Feld | Inhalt |
|---|---|
| **Zweck** | Willkommens-Mail Gratis-Test, Antworten auf Schul-/Enterprise-Anfragen |
| **Rechtsgrundlage** | Vertragserfüllung bzw. vorvertragliche Massnahme |
| **Betroffene Personen** | Interessenten, Lehrpersonen, Schulen |
| **Personendatenkategorien** | E-Mail, Name (falls angegeben), Nachrichteninhalt |
| **Empfänger** | Resend (Drogon, Inc.) |
| **Aufbewahrung** | Bis Widerruf / Abschluss der Anfrage |
| **Drittstaaten** | USA – SCCs |
| **TOMs** | Rate-Limit, CORS-Restriktion, HTML-Escape |

## 4. Hosting, Logging, Sicherheit

| Feld | Inhalt |
|---|---|
| **Zweck** | Auslieferung der Web-App, Serverless-Functions, Fehler-/Sicherheits-Logs |
| **Rechtsgrundlage** | Berechtigtes Interesse am sicheren Betrieb |
| **Personendatenkategorien** | IP-Adressen (Logs), User-Agent, HTTP-Method/Path, Fehlerstatus |
| **Empfänger** | Vercel Inc. |
| **Aufbewahrung** | ≤ 30 Tage (Vercel-Standard) |
| **Drittstaaten** | USA – RZ Frankfurt (DE); SCCs + Swiss-U.S. DPF |
| **TOMs** | HTTPS-only, strikte CSP, CORS-Allowlist, IP-basiertes Rate-Limit |

## Allgemeine TOMs

- **Verschlüsselung in Transit:** TLS 1.2+ überall
- **HMAC-signierte Tokens** für Trial-State
- **Datenminimierung:** Pseudonymisierung vor KI-Übermittlung; keine zentrale Schülerdaten-DB
- **Speicherbegrenzung:** TTL 10 Min für QR-Relay; Bild-Komprimierung
- **Integrität:** Lizenz-Validierung gegen Stripe, Revocation-Flag
- **Verfügbarkeit:** Vercel-Hosting, EU-RZ
- **Sub-Bearbeiter-Kontrolle:** Pflicht-AVV/DPA mit jedem Anbieter

## Meldepflicht

Verletzung der Datensicherheit → unverzüglich Meldung an EDÖB (Art. 24 nDSG) bei hohem Risiko, plus Information betroffener Auftraggeber. Internes Runbook siehe `meldeplan.md` (TODO).

## Aktualisierungen

Aktualisierung bei jeder wesentlichen Änderung. Letzte Überprüfung: 2025-05-28.
