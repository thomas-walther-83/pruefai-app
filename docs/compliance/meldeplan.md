# Meldeplan Datenschutzverletzung

Internes Runbook · Stand 2026-05-28 · nach Art. 24 nDSG und Art. 33 DSGVO

## Zweck

Schritt-für-Schritt-Anweisung für den Fall einer **Verletzung der Datensicherheit** (Datenpanne). Ziel: innerhalb von 72 Stunden nach Bekanntwerden die Meldung an die zuständige Behörde absetzen, Betroffene angemessen informieren und den Vorfall sauber dokumentieren.

## Was zählt als Datenschutzverletzung?

Eine **Verletzung der Datensicherheit** liegt vor bei einer Verletzung der Sicherheit, die zur Vernichtung, zum Verlust, zur Veränderung, zur unbefugten Offenlegung oder zum unbefugten Zugriff auf Personendaten führt. Beispiele in PruefAI:

- Lizenzschlüssel-Leck (z. B. öffentlich auf GitHub veröffentlicht)
- Unbefugter Zugriff auf Stripe-Customer-Daten
- Unbefugter Zugriff auf einen API-Endpoint (Brute Force, Rate-Limit-Umgehung)
- Datenleck bei einem Sub-Auftragsbearbeiter (Anthropic, Stripe, Vercel, Upstash, Resend), das die übermittelten Daten betrifft
- Fehler in der Pseudonymisierung, der zu Klartextnamen in der KI-Übermittlung führt
- Verlust eines Geräts, auf dem unverschlüsselt Schülerdaten gespeichert sind (lokal beim Lehrer – betrifft den Lehrer als Verantwortlichen, PruefAI ist nicht direkt meldepflichtig, aber informativ)

## Sofortmassnahmen (in den ersten 60 Minuten)

1. **Vorfall stoppen / eindämmen**: betroffenen Endpoint sperren, kompromittierten Lizenzschlüssel via `metadata.revoked='true'` in Stripe deaktivieren, Service-Worker-Cache versionsbumpen, etc.
2. **Beweissicherung**: Logs sichern (Vercel-Function-Logs, GitHub-Activity, E-Mails), Screenshots der betroffenen Stelle.
3. **Schwere abschätzen** (siehe nächster Abschnitt).
4. **Erstinfo an info@pruefai.ch** als interne Notiz ablegen mit: Zeitpunkt der Entdeckung, betroffene Daten, geschätzte Anzahl Betroffener, vermutete Ursache.

## Schwere-Bewertung

| Risiko | Beispiele | Meldepflicht EDÖB | Meldepflicht Betroffene |
|---|---|---|---|
| **Niedrig** | Logdateien mit IP-Adressen versehentlich öffentlich, ohne Personenbezug zu Schülern | optional dokumentieren | nicht zwingend |
| **Mittel** | Lehrer-E-Mail-Adressen exponiert, Lizenzschlüssel-Leck ohne Schülerdaten | ja, vorsorglich | empfohlen |
| **Hoch** | Schülerdaten exponiert, unbefugter Zugriff auf API-Endpoint mit PII, KI-Übermittlung ohne Pseudonymisierung über längeren Zeitraum | **ja, innert 72 h** (Art. 24 nDSG) | **ja, ohne Verzögerung** |

## Meldung an EDÖB

**Wann:** bei hohem Risiko innert 72 Stunden ab Kenntnisnahme.

**Wie:** Online-Meldeformular des EDÖB unter <https://www.edoeb.admin.ch/edoeb/de/home/datenschutz/grundlagen/meldungen-datenverletzungen.html>

**Mindestinhalte:**
- Art der Verletzung, Anzahl betroffene Personen und Datensätze
- Ursache und Verlauf
- Bereits getroffene und geplante Massnahmen
- Kontakt für Rückfragen (info@pruefai.ch)
- Risikoabschätzung für die Betroffenen

**Wer macht die Meldung:** Thomas Walther als Verantwortlicher.

## Information der Betroffenen

Bei hohem Risiko für die betroffenen Personen müssen diese unverzüglich informiert werden (Art. 24 Abs. 4 nDSG / Art. 34 DSGVO).

**Kanal:**
- Bei Lehrpersonen mit hinterlegter E-Mail (Stripe-Customer / Resend-Lead): individuelle E-Mail.
- Bei breit gestreuter Betroffenheit: zusätzlich Banner auf der Landing Page und in der App.

**Inhalt:**
- Was ist passiert, wann
- Welche Daten sind betroffen
- Welche Risiken bestehen konkret
- Welche Massnahmen wurden getroffen
- Was kann/soll die betroffene Person tun (z. B. lokale Daten sichern, Lizenz erneuern)
- Kontakt für Rückfragen

## Dokumentation

Jede Verletzung – auch wenn keine Meldepflicht besteht – wird intern dokumentiert in `docs/compliance/incidents/<JJJJ-MM-TT>-<kurzbeschreibung>.md` mit:

- Zeitstrahl
- Ursachenanalyse
- Getroffene Massnahmen
- Korrespondenz (E-Mail an EDÖB, Betroffene, Anbieter)
- Lessons Learned

Ein interner Vorfall-Index liegt unter `docs/compliance/incidents/README.md`.

## Lessons Learned und Nachbesserung

Nach jedem Vorfall:

- Wurzelursache adressieren (Code-Fix, Konfigurations-Änderung, neue Tests).
- Diesen Meldeplan ggf. anpassen.
- Bei wiederholten Vorfällen: gesamte Sicherheitsarchitektur überprüfen (OWASP-Pentest, externes Sicherheitsaudit).

## Re-Check

Diesen Plan **mindestens alle 12 Monate** durchgehen, mit Trockenübung („Tabletop-Exercise") simulieren. Letzte Übung: noch nicht durchgeführt.

## Verwandte Dokumente

- [`bearbeitungsverzeichnis.md`](./bearbeitungsverzeichnis.md)
- [`dsfa-ki-verarbeitung.md`](./dsfa-ki-verarbeitung.md)
- [`subprocessors.md`](./subprocessors.md) – Kontakte der Sub-Bearbeiter für Eskalationen
- [`dpa-checklist.md`](./dpa-checklist.md) – Vertragliche Grundlagen
