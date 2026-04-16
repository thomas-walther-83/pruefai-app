# Datenschutzerklärung – LernortAI

**Stand:** Januar 2025  
**Verantwortlicher:** Thomas Walther, LernortAI  
**Kontakt:** info@lernortai.ch

---

## 1. Allgemeine Hinweise

Diese Datenschutzerklärung informiert Sie gemäss dem Schweizer Datenschutzgesetz (nDSG, in Kraft seit 1. September 2023) sowie der Europäischen Datenschutz-Grundverordnung (DSGVO) über die Art, den Umfang und den Zweck der Verarbeitung personenbezogener Daten bei der Nutzung von LernortAI.

---

## 2. Verantwortlicher

**Thomas Walther**  
LernortAI  
Schweiz  
E-Mail: info@lernortai.ch  
Website: https://lernortai.ch

---

## 3. Erhobene Daten

### 3.1 Beim Besuch der Website

- IP-Adresse (anonymisiert)
- Datum und Uhrzeit des Zugriffs
- Browsertyp und -version
- Verwendetes Betriebssystem
- Referrer-URL

Diese Daten werden ausschliesslich zur Gewährleistung des technischen Betriebs erhoben und nach 7 Tagen automatisch gelöscht.

### 3.2 Bei der Nutzung der Korrekturfunktion

Zur KI-gestützten Prüfungskorrektur werden folgende Daten verarbeitet:

- Hochgeladene Prüfungsfotos (Bilder von Schülerarbeiten)
- Prüfungsmetadaten (Name der Prüfung, Maximalpunktzahl, Aufgabenstellungen)
- Schülernamen (soweit vom Lehrer eingegeben)

Diese Daten werden zur Übermittlung an den KI-Dienst (Anthropic Claude) verarbeitet. **Die Bilder und Texte werden nicht dauerhaft gespeichert und nicht für das Training von KI-Modellen verwendet.**

### 3.3 Kundendaten (Abonnement)

Bei Abschluss eines Abonnements werden verarbeitet:

- E-Mail-Adresse
- Zahlungsdaten (verarbeitet durch Stripe, nicht direkt bei LernortAI gespeichert)
- Rechnungsadresse (falls angegeben)
- Lizenzschlüssel

---

## 4. Zweck der Datenverarbeitung

| Zweck | Rechtsgrundlage |
|-------|----------------|
| Bereitstellung der App-Funktionen | Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO) |
| KI-Prüfungskorrektur | Einwilligung / Vertragserfüllung |
| Zahlungsabwicklung | Vertragserfüllung |
| Technischer Betrieb / Sicherheit | Berechtigtes Interesse |
| Kommunikation (Support) | Einwilligung / Vertragserfüllung |

---

## 5. Einsatz von Drittdienstleistern

### 5.1 Anthropic Claude (KI-Verarbeitung)

LernortAI nutzt den KI-Dienst Claude der Anthropic PBC (San Francisco, USA) zur automatisierten Prüfungskorrektur. Bei der Nutzung der KI-Funktion werden Prüfungsbilder und -texte an Anthropic übertragen.

- **Anbieter:** Anthropic PBC, 548 Market Street, San Francisco, CA 94105, USA
- **Datenschutz:** https://www.anthropic.com/privacy
- **Verarbeitungszweck:** KI-gestützte Texterkennung und Bewertung
- **Übertragung in Drittland:** Ja (USA) – mit geeigneten Garantien (SCCs)
- **Hinweis:** Anthropic verwendet API-Daten standardmässig **nicht** zum Training von Modellen.

### 5.2 Stripe (Zahlungsabwicklung)

Zahlungen werden über Stripe Payments Europe Ltd. abgewickelt.

- **Anbieter:** Stripe Payments Europe Ltd., 1 Grand Canal Street Lower, Dublin, Irland
- **Datenschutz:** https://stripe.com/de/privacy
- **Verarbeitungszweck:** Zahlungsabwicklung, Abonnementverwaltung

### 5.3 Vercel (Hosting)

Die App wird auf der Infrastruktur von Vercel Inc. gehostet.

- **Anbieter:** Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA
- **Rechenzentrum:** Frankfurt am Main, Deutschland (EU)
- **Datenschutz:** https://vercel.com/legal/privacy-policy

### 5.4 Supabase (Datenbank)

Strukturierte App-Daten (Klassen, Prüfungen, Ergebnisse) werden in Supabase gespeichert.

- **Anbieter:** Supabase Inc.
- **Rechenzentrum:** EU (Frankfurt)
- **Datenschutz:** https://supabase.com/privacy

---

## 6. Datenspeicherung und -löschung

- **Prüfungsfotos:** Werden für die Dauer der Sitzung im Browser (IndexedDB) bzw. in Supabase Storage gespeichert und können jederzeit gelöscht werden.
- **Korrekturergebnisse:** Verbleiben in Ihrer Datenbank bis zur manuellen Löschung.
- **Kundendaten:** Werden für die Dauer des Vertragsverhältnisses und danach gemäss gesetzlichen Aufbewahrungsfristen (10 Jahre für Buchungsbelege) gespeichert.
- **Logdaten:** Werden nach 7 Tagen automatisch gelöscht.

---

## 7. Ihre Rechte

Sie haben gemäss nDSG und DSGVO folgende Rechte:

- **Auskunftsrecht** (Art. 25 nDSG / Art. 15 DSGVO)
- **Recht auf Berichtigung** (Art. 32 nDSG / Art. 16 DSGVO)
- **Recht auf Löschung** (Art. 32 nDSG / Art. 17 DSGVO)
- **Recht auf Einschränkung der Verarbeitung** (Art. 18 DSGVO)
- **Recht auf Datenübertragbarkeit** (Art. 20 DSGVO)
- **Widerspruchsrecht** (Art. 21 DSGVO)

Zur Ausübung Ihrer Rechte wenden Sie sich an: info@lernortai.ch

---

## 8. Beschwerderecht

Sie haben das Recht, sich bei der zuständigen Datenschutzbehörde zu beschweren:

- **Schweiz:** Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter (EDÖB), www.edoeb.admin.ch
- **EU/EWR:** Zuständige nationale Datenschutzbehörde Ihres Wohnsitzlandes

---

## 9. Datensicherheit

LernortAI trifft technische und organisatorische Massnahmen zum Schutz Ihrer Daten, insbesondere:

- Verschlüsselte Übertragung via HTTPS/TLS
- Sichere Speicherung von API-Schlüsseln (serverseitig, nicht im Frontend)
- Regelmässige Sicherheitsupdates

---

## 10. Cookies

LernortAI verwendet **keine Tracking-Cookies** und keine Werbe-Cookies. Technisch notwendige Browser-Speicher (LocalStorage, IndexedDB) werden ausschliesslich für den App-Betrieb verwendet.

---

## 11. Änderungen dieser Datenschutzerklärung

Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen. Die aktuelle Version ist stets unter https://lernortai.ch/datenschutz abrufbar.

---

*Letztes Update: Januar 2025*
