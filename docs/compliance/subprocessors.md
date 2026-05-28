# Sub-Auftragsbearbeiter PruefAI

Stand: 2025-05-28 · Quelle für die öffentliche Seite [/subprocessors](https://pruefai.ch/subprocessors).

## Verantwortliche/r

Thomas Walther, PruefAI, Schweiz · info@pruefai.ch

## Aktive Sub-Auftragsbearbeiter

| Anbieter | Funktion | Daten | Standort | Drittland-Grundlage |
|---|---|---|---|---|
| **Anthropic PBC** | KI-Korrektur (Claude Haiku 4.5) | Prüfungsbilder, Prüfungsmetadaten – **ohne Schülernamen** (Pseudonymisierung) | San Francisco, USA | SCCs + Swiss-U.S. DPF |
| **Stripe Payments Europe Ltd.** | Zahlungsabwicklung, Abonnementverwaltung | Lehrer-E-Mail, Zahlungsdaten, Lizenz-Metadaten | Dublin, Irland (EU) | adäquates Schutzniveau (EU) |
| **Vercel Inc.** | Hosting, Serverless-Functions | IP-Adressen (Logs), HTTP-Requests; keine persistente Schülerdaten | USA, RZ Frankfurt (DE) | SCCs + Swiss-U.S. DPF |
| **Upstash Inc.** | temporärer Foto-Relay (QR-Code-Funktion) | Prüfungsbilder bei aktiver QR-Funktion – TTL 10 Min, dann automatisch gelöscht | Burbank, USA | SCCs |
| **Resend (Drogon, Inc.)** | transaktionale E-Mails (Willkommens-Mail, Schul-/Enterprise-Antworten) | E-Mail-Adresse, Inhalt | San Francisco, USA | SCCs |

Mit allen Anbietern bestehen Auftragsverarbeitungs-Verträge (DPAs/AVVs).

## Lokale Speicherung im Browser

Folgende Daten verbleiben ausschliesslich in der Browser-Datenbank (IndexedDB / LocalStorage):

- Klassen, Schülernamen, Schülernummern
- Prüfungen, Noten, Punkte, Korrekturkommentare
- Hochgeladene Prüfungsbilder (kurzzeitig an Anthropic übertragen, dort nicht persistiert)
- App-Einstellungen, Notenformel-Defaults

## Verwendete Anthropic-Modelle

- Korrektur: `claude-haiku-4-5`
- Vorlagen-Analyse / Qualitäts-Check: `claude-haiku-4-5`

Anthropic verwendet API-Daten standardmässig **nicht** zum Training von KI-Modellen und speichert sie nicht dauerhaft.

## Änderungs-Management

Wesentliche Änderungen am Kreis der Sub-Auftragsbearbeiter werden auf der öffentlichen Seite publiziert. Auftraggeber mit hinterlegter E-Mail-Adresse werden zusätzlich per E-Mail informiert.
