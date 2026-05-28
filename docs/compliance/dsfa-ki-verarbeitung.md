# Datenschutz-Folgenabschätzung – KI-Korrektur

Nach Art. 22 nDSG / Art. 35 DSGVO · Stand 2025-05-28 · Quelle für die öffentliche Seite [/dsfa](https://pruefai.ch/dsfa).

## 1. Anlass und Zweck

PruefAI verarbeitet handschriftliche Prüfungen von Schülerinnen und Schülern (überwiegend Minderjährige) mit einem KI-Modell (Anthropic Claude). Eine DSFA wird hier als gute Praxis durchgeführt, auch wenn die Schwelle des Art. 22 nDSG (rein automatisierte Einzelentscheidung) durch das Mensch-im-Loop-Setup bewusst nicht erreicht wird.

## 2. Beschreibung der Bearbeitung

### Datenfluss

1. Lehrperson fotografiert/scannt Prüfung, Bilder lokal im Browser (IndexedDB).
2. Per Knopfdruck: Bilder **ohne Schülername** + neutrale Metadaten an Claude (Anthropic, USA).
3. Claude liefert strukturiertes JSON (Punkte, Note, Begründung, Verbesserungsvorschlag pro Aufgabe).
4. Lehrperson überprüft, korrigiert, bestätigt jede Bewertung.
5. Finale Note ausschliesslich lokal. Bei Anthropic nicht persistiert (Standard-Terms).

### Akteure

- Verantwortliche: Lehrperson / Schule (für Schülerdaten)
- Auftragsbearbeiterin: PruefAI
- Sub-Bearbeiterin: Anthropic PBC (USA)
- Betroffene: Schüler/innen (minderjährig), Lehrperson

## 3. Notwendigkeit und Verhältnismässigkeit

- ~80 % Zeitersparnis für Lehrpersonen
- Pseudonymisierung; keine zentrale Schülerdaten-DB
- Keine Persistenz bei der KI, kein Training
- Mensch-im-Loop: finale Note bei der Lehrperson
- Schweizer Notensystem-Spezifik: keine vergleichbare CH-Lösung

## 4. Risikoanalyse

| Risiko | W'keit | Schwere | Massnahmen |
|---|---|---|---|
| Re-Identifikation aus Bildinhalt (Handschrift, Name oben) | niedrig | mittel | Pseudonymisierung Metadaten; Empfehlung "Name abdecken" im Upload-Dialog; Anthropic ohne Re-ID-Interesse, ohne Persistenz |
| Falsche Bewertung durch KI | mittel | mittel | Mensch-im-Loop; finale Note Lehrer; nachvollziehbare Begründung pro Aufgabe |
| Datenleck bei Sub-Bearbeiter | niedrig | mittel | DPAs, SCCs + Swiss-U.S. DPF; Standard-Terms ohne Persistenz; kurze Verarbeitungszeit |
| Unbefugter Zugriff lokaler Browser-Speicher | niedrig | niedrig | Geräte-Sicherheit Sache des Nutzers; kein zentrales Backend |
| Reproduzierbarkeit der KI-Antworten (Trainingsdaten-Leck) | niedrig | niedrig | Anthropic kein Training, keine Persistenz |
| Fehlende elterliche Einwilligung Minderjähriger | mittel | mittel | Lehrperson trägt Rechtsgrundlage (kant. Schulrecht / Einwilligung); explizite Bestätigung in der App beim ersten Schüler-Anlegen |
| Lizenz-Missbrauch | niedrig | niedrig | Stripe-Validierung, Revocation-Flag |

## 5. Massnahmen

- Pseudonymisierung der Schülernamen vor KI-Übermittlung
- Lokale Speicherung (IndexedDB) aller identifizierenden Daten
- Mensch-im-Loop: Lehrperson bestätigt jede Bewertung
- Datenminimierung: nur Bild + Prüfungsmetadaten an die KI
- DPAs mit allen Sub-Bearbeitern (SCCs + Swiss-U.S. DPF)
- Bild-Komprimierung vor Übertragung
- QR-Foto-Relay TTL 10 Min, automatische Löschung
- App-Onboarding-Bestätigung der Rechtsgrundlage durch die Lehrperson
- Datenschutz-Tipp im Upload-Dialog: Namen abdecken
- Transparente Kommunikation in FAQ und DSE (kein „Daten bleiben pauschal lokal")

## 6. Restrisiko

Nach Massnahmen-Umsetzung niedrig. Primär theoretisch (Datenleck beim KI-Anbieter trotz SCC und Standard-Terms). Geringe Wahrscheinlichkeit, überschaubare Schwere ohne Klarnamen-Übermittlung.

## Fazit

Bearbeitung ist verhältnismässig und unter den getroffenen Massnahmen zulässig. Mindestens jährliche Überprüfung bzw. bei wesentlichen Änderungen (anderer KI-Anbieter, neue Datenkategorien, neue Sub-Bearbeiter).

Letzte Überprüfung: 2025-05-28.
