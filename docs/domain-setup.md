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
   - Optional: 1× TXT auf `_dmarc.pruefai.ch` (kann Resend für dich setzen — wir machen das aber gezielt, siehe Abschnitt 3)
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

## 3. DMARC-Record (Anti-Spoofing-Policy)

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

## 4. SPF am Apex (optional, falls Mail vom Apex versendet wird)

Resend versendet von `send.pruefai.ch` (Subdomain), deshalb braucht die
Apex-Domain `pruefai.ch` **technisch kein SPF**. Aber: manche Filter
werten Domains mit fehlendem Apex-SPF schlechter. Sicherheitsmässig
sinnvoll: ein restriktives Apex-SPF, das alles ablehnt:

| Feld | Wert |
|------|------|
| Typ | `TXT` |
| Name | _leer_ (Apex) |
| Wert | `v=spf1 -all` |

Falls du später info@pruefai.ch via Cyon-Mail oder einen anderen Provider
versendest: dann hier `include:<provider-spf>` einfügen.

---

## 5. MTA-STS und TLS-RPT (optional, fortgeschritten)

Für eingehende Mail (wenn info@pruefai.ch jemals eine Mailbox bekommt):
erzwingt TLS-verschlüsselte SMTP-Verbindungen.

Setup ist nicht trivial (eigene Subdomain `mta-sts.pruefai.ch` mit
HTTPS-Policy-File). Aktuell nicht relevant, da kein eingehender Mail-Empfang.

---

## 6. Domain-Reputation an Filterhersteller melden

Wenn pruefai.ch von SmartScreen / Safe Browsing / Family-Filtern als
„newly registered" oder „suspicious" markiert wird: aktiv eine Re-Klassi-
fizierung anstossen.

Diese Schritte sind **manuell** (jeder Anbieter verlangt Captcha + Form):

### 6.1 Microsoft SmartScreen
https://feedback.smartscreen.microsoft.com/feedback.aspx?t=2
- *Web Address*: `https://pruefai.ch`
- *Submission Type*: **„Mark as safe"**
- Begründung: Beschreibung der App (KI-Korrekturhilfe für Lehrpersonen, kein User-Generated-Content, kein Phishing-Risiko)
- E-Mail-Adresse zur Rückmeldung angeben

### 6.2 Google Safe Browsing
https://safebrowsing.google.com/safebrowsing/report_error/
- URL: `https://pruefai.ch`
- Begründung dito

### 6.3 Cisco Talos
https://talosintelligence.com/reputation_center/lookup?search=pruefai.ch
- Falls dort eine Kategorie-Bewertung kommt, „Suggest reclassification" anklicken
- Vorgeschlagene Kategorie: *Educational Institutions* oder *Web-based Productivity*

### 6.4 Webroot / BrightCloud
https://www.brightcloud.com/tools/url-ip-lookup.php
- Eingabe: `pruefai.ch`
- Falls falsche Kategorie: rechts „Submit Dispute" klicken

Typische Bearbeitungszeit: 2–7 Tage.

---

## 7. Verifikations-Workflow

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
2. **Resend-Domain** (Abschnitt 2) — 3-4 Records, blockiert Mail-Versand
3. **DMARC** (Abschnitt 3) — 1 Record, mit `p=none` starten
4. **`node scripts/check-dns.mjs`** ausführen → grüne Häkchen prüfen
5. **Apex-SPF** (Abschnitt 4) — 1 Record, optional
6. **Reputation-Submissions** (Abschnitt 6) — 4 Formulare, dauert je 2 Min
7. **DMARC nach 2 Wochen** auf `p=quarantine` hochziehen
8. **DMARC nach weiteren 2 Wochen** auf `p=reject` hochziehen

Schritte 1-6 sind in ~30 Minuten erledigt, dann ist die Domain professionell aufgesetzt.
