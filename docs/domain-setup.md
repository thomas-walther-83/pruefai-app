# Domain-Setup für pruefai.ch

Reputations- und Sicherheits-Konfiguration der Domain. Reihenfolge der
Abschnitte spiegelt die Priorität: oben = wirkt sofort, unten = optional.

> **Verifikation:** `node scripts/check-dns.mjs` prüft jederzeit, welche
> der unten beschriebenen Records bereits gesetzt sind und meldet Lücken
> mit konkretem Fix-Vorschlag.

---

## 1. CAA-Record (Cert-Mis-Issuance-Schutz)

Signalisiert: „Nur Let's Encrypt darf TLS-Zertifikate für diese Domain
ausstellen." Verhindert, dass eine kompromittierte Drittpartei z.B. via
GoDaddy ein Cert ausstellt und damit die Domain übernimmt.

**Cyon → DNS-Editor → DNS-Record hinzufügen**

| Feld | Wert |
|------|------|
| Typ | `CAA` |
| Name | _leer_ (Apex) |
| Flag | `0` |
| Tag | `issue` |
| Wert | `letsencrypt.org` |
| TTL | Default |

Falls Cyons UI nur ein einziges Wert-Feld bietet:
```
0 issue "letsencrypt.org"
```

---

## 2. Resend-Domain verifizieren (SPF + DKIM für Transaktional-Mails)

Damit Lizenz-Mails und Lead-Bestätigungen authentifiziert versendet werden
und nicht im Spam landen. **Pflicht für die App** — ohne Resend-Verifikation
landen `noreply@pruefai.ch`-Mails entweder im Spam oder werden gar nicht
abgeschickt.

### 2.1 Resend-Seite

1. https://resend.com/domains → **Add Domain** → `pruefai.ch` → Continue
2. Resend zeigt dir **3-4 DNS-Records** zum Eintragen:
   - 1× MX auf `send.pruefai.ch` (für Bounce-Handling, Ziel typischerweise `feedback-smtp.<region>.amazonses.com`)
   - 1× TXT auf `send.pruefai.ch` (SPF: `v=spf1 include:amazonses.com ~all`)
   - 1× TXT auf `resend._domainkey.pruefai.ch` (DKIM-Public-Key, langer Wert mit `p=...`)
   - Optional: 1× TXT auf `_dmarc.pruefai.ch` (kann Resend für dich setzen — wir machen das aber gezielt, siehe Abschnitt 4)
3. Kopiere jeden Wert (Resend hat „Copy"-Buttons).

### 2.2 Cyon-Seite

Im DNS-Editor jeden Record so anlegen wie Resend ihn vorgibt. Wichtig:

- Bei **MX-Records** trägst du den Hostname-Teil im Name-Feld als `send` ein (nicht `send.pruefai.ch.` und nicht leer). Cyon ergänzt die Apex-Domain automatisch.
- Bei **TXT-Records mit Selector** trägst du im Name-Feld z.B. `resend._domainkey` ein (Cyon ergänzt `.pruefai.ch`).
- DKIM-TXT-Wert in Anführungszeichen einfügen, exakt wie Resend ihn liefert, ohne Zeilenumbrüche.

### 2.3 Verifikation

Zurück bei Resend → bei `pruefai.ch` auf **Verify DNS Records** klicken.
Dauert 1–30 Minuten je nach DNS-Propagation. Wenn alle drei Häkchen grün
sind, ist die Domain einsatzbereit.

---

## 3. Zoho Mail (Posteingang + Versand ab Apex)

`info@pruefai.ch` läuft über **Zoho Mail** — sowohl eingehend (Posteingang)
als auch ausgehend (manuelle Antworten). Damit Zoho-Mails authentifiziert
sind und nicht im Spam landen, braucht der **Apex** (`pruefai.ch`) eigene
MX-, SPF- und DKIM-Records. Resend (Abschnitt 2) bleibt davon unberührt,
da Resend ausschliesslich über `send.pruefai.ch` versendet.

> **Rechenzentrum:** Zoho hat regionale DCs (`.eu`, `.com`, `.in`). Die
> Hostnamen unten zeigen die EU-Variante. In der Zoho-Konsole stehen die
> exakten Werte — `check-dns.mjs` matcht DC-unabhängig auf `zoho`.

### 3.1 MX (Posteingang)

**Cyon → DNS-Editor → DNS-Record hinzufügen** (Name-Feld _leer_ = Apex):

| Typ | Name | Priorität | Wert |
|-----|------|-----------|------|
| `MX` | _leer_ | `10` | `mx.zoho.eu` |
| `MX` | _leer_ | `20` | `mx2.zoho.eu` |
| `MX` | _leer_ | `50` | `mx3.zoho.eu` |

### 3.2 SPF (Apex)

Ein TXT-Record am Apex, der Zoho als zulässigen Versender deklariert.
Siehe Abschnitt 5 — der Apex-SPF muss `include:zohomail.eu` enthalten.

### 3.3 DKIM (Apex)

Zoho-Konsole → **Domains → pruefai.ch → Email Configuration → DKIM**.
Zoho zeigt einen **Selektor** (z.B. `zmail`) und den **Public Key**.

| Typ | Name | Wert |
|-----|------|------|
| `TXT` | `<selektor>._domainkey` | `v=DKIM1; k=rsa; p=…` (exakt aus Zoho-Konsole) |

Danach in der Zoho-Konsole **Verify** klicken.

---

## 4. DMARC-Record (Anti-Spoofing-Policy)

DMARC bündelt SPF + DKIM und sagt empfangenden Mailservern, was passieren
soll, wenn weder SPF noch DKIM passt: nichts (`none`), in Spam verschieben
(`quarantine`) oder ablehnen (`reject`).

**Strategie:** wir starten weich (`p=none`), prüfen 2 Wochen die Reports,
ziehen dann an. Damit riskieren wir keine fälschlich gefilterten Mails.

**Cyon → DNS-Editor → DNS-Record hinzufügen**

| Feld | Wert |
|------|------|
| Typ | `TXT` |
| Name | `_dmarc` |
| Wert | `v=DMARC1; p=none; rua=mailto:dmarc-reports@pruefai.ch; ruf=mailto:dmarc-reports@pruefai.ch; fo=1` |
| TTL | Default |

Optional, falls du noch keine Mailbox auf der Domain hast: ersetze
`dmarc-reports@pruefai.ch` durch eine externe Adresse (z.B. `thomas-walther@gmx.ch`).
Die meisten Mailprovider akzeptieren Cross-Domain-RUA aber nur, wenn auf
`pruefai.ch._report._dmarc.<ziel-domain>` ein bestätigender TXT-Record
existiert — siehe https://dmarc.org/overview/

**Nach 2 Wochen Beobachtung** (Reports lesen, prüfen ob alle eigenen Mails
SPF+DKIM-aligned sind):

```
v=DMARC1; p=quarantine; pct=25; rua=mailto:dmarc-reports@pruefai.ch
```

**Nach weiteren 2 Wochen** (wenn Quarantäne sauber bleibt):

```
v=DMARC1; p=reject; rua=mailto:dmarc-reports@pruefai.ch
```

---

## 5. SPF am Apex (Pflicht — Zoho versendet ab Apex)

Da `info@pruefai.ch` über Zoho (Abschnitt 3) auch **ausgehende** Mail
verschickt, muss der Apex einen SPF-Record haben, der Zoho autorisiert.
Ohne ihn scheitert die SPF-Prüfung beim Empfänger und DMARC schlägt fehl.

| Feld | Wert |
|------|------|
| Typ | `TXT` |
| Name | _leer_ (Apex) |
| Wert | `v=spf1 include:zohomail.eu ~all` |

Resend versendet ausschliesslich über `send.pruefai.ch` und hat dort sein
eigenes SPF (Abschnitt 2) — der Apex-SPF braucht **keinen** Resend-Include.

---

## 6. MTA-STS und TLS-RPT (optional, fortgeschritten)

Erzwingt TLS-verschlüsselte SMTP-Verbindungen für eingehende Mail an
`info@pruefai.ch` (Zoho). Setup ist nicht trivial (eigene Subdomain
`mta-sts.pruefai.ch` mit HTTPS-Policy-File). Sicherheitsgewinn ist real,
aber niedrige Priorität — Zoho akzeptiert TLS bereits opportunistisch.

---

## 7. Domain-Reputation an Filterhersteller melden

Wenn pruefai.ch von SmartScreen / Safe Browsing / Family-Filtern als
„newly registered" oder „suspicious" markiert wird: aktiv eine Re-Klassi-
fizierung anstossen.

Diese Schritte sind **manuell** (jeder Anbieter verlangt Captcha + Form):

### 7.1 Microsoft SmartScreen
https://feedback.smartscreen.microsoft.com/feedback.aspx?t=2
- *Web Address*: `https://pruefai.ch`
- *Submission Type*: **„Mark as safe"**
- Begründung: Beschreibung der App (KI-Korrekturhilfe für Lehrpersonen, kein User-Generated-Content, kein Phishing-Risiko)
- E-Mail-Adresse zur Rückmeldung angeben

### 7.2 Google Safe Browsing
https://safebrowsing.google.com/safebrowsing/report_error/
- URL: `https://pruefai.ch`
- Begründung dito

### 7.3 Cisco Talos
https://talosintelligence.com/reputation_center/lookup?search=pruefai.ch
- Falls dort eine Kategorie-Bewertung kommt, „Suggest reclassification" anklicken
- Vorgeschlagene Kategorie: *Educational Institutions* oder *Web-based Productivity*

### 7.4 Webroot / BrightCloud
https://www.brightcloud.com/tools/url-ip-lookup.php
- Eingabe: `pruefai.ch`
- Falls falsche Kategorie: rechts „Submit Dispute" klicken

Typische Bearbeitungszeit: 2–7 Tage.

---

## 8. Verifikations-Workflow

Nach jeder DNS-Änderung **5–30 Minuten warten** (Cyon-DNS hat 4h TTL,
aber Resolver cachen meist kürzer), dann lokal:

```bash
node scripts/check-dns.mjs
```

oder in GitHub: **Actions → DNS Verification → Run workflow.**

Das Skript probt alle hier dokumentierten Records via DNS-Lookup und
gibt eine Checkliste aus mit konkretem Fix-Vorschlag bei Lücken.

---

## Reihenfolge zum Abarbeiten (TL;DR)

1. **CAA** (Abschnitt 1) — 1 Record, sofort
2. **Resend-Domain** (Abschnitt 2) — 3-4 Records, blockiert App-Mail-Versand
3. **Zoho Mail** (Abschnitt 3) — MX + DKIM für `info@pruefai.ch`
4. **Apex-SPF** (Abschnitt 5) — 1 Record, Pflicht für Zoho-Versand
5. **DMARC** (Abschnitt 4) — 1 Record, mit `p=none` starten
6. **`node scripts/check-dns.mjs`** ausführen → grüne Häkchen prüfen
7. **Reputation-Submissions** (Abschnitt 7) — 4 Formulare, dauert je 2 Min
8. **DMARC nach 2 Wochen** auf `p=quarantine` hochziehen
9. **DMARC nach weiteren 2 Wochen** auf `p=reject` hochziehen

Schritte 1-7 sind in ~30 Minuten erledigt, dann ist die Domain professionell aufgesetzt.
