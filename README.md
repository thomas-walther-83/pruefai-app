# Pruefai – KI-gestützte Prüfungskorrektur

[![MIT Lizenz](https://img.shields.io/badge/Lizenz-MIT-blue.svg)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-yellow.svg)](index.html)

**Pruefai** ist eine webbasierte Applikation für Lehrpersonen, die bei der Korrektur von Prüfungen mithilfe von KI (Claude) unterstützt. Alle Daten werden lokal im Browser (IndexedDB) gespeichert – kein externes Backend, keine Cloud-Datenbank.

---

## Funktionen

- **Datensouveränität** – Alle Schüler- und Notendaten bleiben lokal im Browser (IndexedDB), ohne Cloud-Synchronisation
- **Mehrseiten-Scan-Support** – Prüfungen als Fotos oder Scans hochladen (mehrseitig)
- **Mobile-Kamera-Upload** – QR-Code-Relay: Smartphone fotografiert, PC empfängt automatisch
- **KI-Korrektur** – Automatische Bewertung mit Claude AI (API-Key sicher auf Server)
- **Schweizer Notensystem** – Noten 1.0–6.0, Bestehensgrenze 4.0, verschiedene Schultypen
- **Klassenverwaltung** – Klassen, Schüler, Fächer, Bewertungsraster organisieren
- **Lernstoff-Upload** – Musterlösungen und Aufgabenstellungen als Dokumente hinterlegen
- **PDF-Export** – Notenlisten und Korrekturen als PDF exportieren
- **PWA** – Installierbar als App auf dem Gerät, Mobile Bottom-Navigation

---

## Tech-Stack

| Komponente    | Technologie                                        |
|---------------|----------------------------------------------------|
| Frontend      | Vanilla HTML / CSS / JavaScript (kein Build-Schritt) |
| Datenspeicher | IndexedDB (browserlokale Datenbank, kein Server)   |
| KI            | Anthropic Claude API (Server-Proxy `/api/claude`)  |
| PDF-Export    | jsPDF (CDN)                                        |
| Lizenzierung  | Stripe (Checkout, Webhook, Portal)                 |
| Deployment    | Vercel (Serverless Functions) + GitHub Pages       |
| Auth          | Lizenzkey-basiert (kein separates Auth-System)     |

---

## Schnellstart

### Voraussetzungen

- [Vercel-Konto](https://vercel.com) (für Deployment und API-Proxy)
- [Anthropic API-Key](https://console.anthropic.com) (für KI-Korrektur)
- Moderner Webbrowser (Chrome, Firefox, Safari, Edge)

> **Optional:** [Stripe-Konto](https://stripe.com) für Lizenzverkauf (Starter / Pro / Max).  
> Ohne Stripe funktioniert die App mit `SKIP_LICENSE=true` im Entwicklungs- oder Demo-Betrieb.

### Schritt 1 – Repository forken und lokal klonen

```bash
git clone https://github.com/thomas-walther-83/pruefai-app.git
cd pruefai-app
```

### Schritt 2 – Umgebungsvariablen einrichten

Kopiere `.env.example` nach `.env` und fülle die Werte aus:

```bash
cp .env.example .env
```

Mindestanforderung für lokalen Betrieb:

| Variable           | Wert                         |
|--------------------|------------------------------|
| `ANTHROPIC_API_KEY`| `sk-ant-...`                 |
| `ALLOWED_ORIGINS`  | `http://localhost:3000`      |
| `SKIP_LICENSE`     | `true` (für lokale Entwicklung) |

### Schritt 3 – Lokal starten

```bash
# Vercel Dev (mit API-Proxy, empfohlen)
npm install -g vercel
vercel dev
# → http://localhost:3000

# Oder einfacher lokaler Server (ohne KI-Funktionen)
python3 -m http.server 8000
# → http://localhost:8000
```

### Schritt 4 – Deployment auf Vercel

```bash
vercel deploy
```

Setze folgende **Environment Variables** in Vercel (Settings → Environment Variables):

| Variable              | Beschreibung                                         |
|-----------------------|------------------------------------------------------|
| `ANTHROPIC_API_KEY`   | Anthropic API-Key (sk-ant-...)                       |
| `ALLOWED_ORIGINS`     | App-URL, z.B. `https://pruefai.ch`                  |
| `SKIP_LICENSE`        | `false` (Lizenz immer prüfen, empfohlen für Prod.)   |
| `TRIAL_SECRET`        | Zufälliger 32+-Zeichen-String für signierte Trials   |
| `STRIPE_SECRET_KEY`   | Stripe Secret Key (optional, für Lizenzverkauf)      |
| `STRIPE_WEBHOOK_SECRET`| Stripe Webhook Secret (optional)                    |
| `STRIPE_PRICE_STARTER`| Stripe Price ID für Starter-Plan (optional)          |
| `STRIPE_PRICE_PRO`    | Stripe Price ID für Pro-Plan (optional)              |
| `STRIPE_PRICE_MAX`    | Stripe Price ID für Max-Plan (optional)              |
| `RESEND_API_KEY`      | Resend API-Key für Lizenz-E-Mail nach Kauf (optional)|
| `ADMIN_EMAIL`         | Admin-E-Mail für interne Benachrichtigungen          |

> **Wichtig:** Der `ANTHROPIC_API_KEY` wird **nie im Browser gespeichert**. Alle KI-Calls laufen über den serverseitigen Proxy `/api/claude`.

---

## Projektstruktur

```
pruefai-app/
├── index.html              # Komplette App (Single-File, Vanilla JS)
├── landing.html            # Marketing-Landingpage mit Preistabelle
├── checkout-success.html   # Stripe Checkout Success-Seite
├── agb.html                # AGB
├── avv.html                # Auftragsverarbeitungsvertrag
├── datenschutz.html        # Datenschutzerklärung
├── manifest.json           # PWA-Manifest
├── sw.js                   # Service Worker (Offline-Support)
├── README.md               # Diese Datei
├── CHANGELOG.md            # Versionshistorie
├── CONTRIBUTING.md         # Beitragsrichtlinien und Backlog-Prozess
├── package.json            # Projektmetadaten und npm-Skripte
├── .env.example            # Vorlage für Umgebungsvariablen
├── vercel.json             # Vercel Routing-Konfiguration
├── .gitignore
├── LICENSE
├── api/                    # Vercel Serverless Functions
│   ├── claude.js           # KI-Korrektur-Proxy (mit Lizenzprüfung)
│   ├── config.js           # Schulname aus Env-Variable
│   ├── relay.js            # QR-Code-Foto-Relay (in-memory, TTL 10 min)
│   ├── validate-license.js # Lizenzvalidierung via Stripe
│   ├── stripe-checkout.js  # Stripe Checkout-Session
│   ├── stripe-webhook.js   # Stripe Webhook (Lizenzschlüssel per E-Mail)
│   ├── stripe-portal.js    # Stripe Customer Portal
│   ├── capture-lead.js     # Lead-Capture-Formular
│   ├── get-license.js      # Lizenzschlüssel-Abfrage
│   └── contact-enterprise.js # Enterprise-Kontaktformular
├── docs/                   # Rechtliche Dokumente (Markdown)
│   ├── AGB.md
│   ├── AVV.md
│   └── DATENSCHUTZ.md
└── supabase/               # ⚠️ Legacy – nicht mehr verwendet
    ├── schema.sql
    ├── rls-policies.sql
    └── migration.sql
```

---

## Datenmodell (IndexedDB)

Alle Daten werden in IndexedDB-Stores im Browser gespeichert. Der `sb`-Wrapper in `index.html` bietet eine Supabase-kompatible API für einfache Datenbankoperationen.

```
klassen ──< schueler
   │
   └──< fach_klassen >── faecher
   │
   └──< pruefung_klassen >── pruefungen ──< lernmaterial
                                  │
                              eintraege (pro Schüler)
                                  │
                              seiten_uploads (Scans / _files)
```

**Weitere Stores:** `rubrics` (Bewertungsraster), `textbausteine`, `_files` (Bild-Blobs), `lehrer`

**Notenskala (Schweizer System):**

| Note | Beschreibung                       |
|------|------------------------------------|
| 6.0  | Sehr gut                           |
| 5.0  | Gut                                |
| 4.5  | Ziemlich gut                       |
| 4.0  | Genügend (Bestehensgrenze)         |
| 3.5  | Fast genügend                      |
| 1.0  | Ungenügend                         |

---

## Deployment

### GitHub Pages (empfohlen – automatisch)

Die App wird automatisch via GitHub Actions auf GitHub Pages deployed, sobald du in den `main`-Branch pushst. Die KI-Funktionen sind dabei nicht verfügbar (kein API-Proxy).

**Öffentliche URL:** https://thomas-walther-83.github.io/pruefai-app/

**Einmalige Einrichtung:**

1. Gehe im Repository zu **Settings → Pages**
2. Wähle unter *Source*: **GitHub Actions**
3. Speichern – danach deployt jeder Push auf `main` die App automatisch

### Vercel (empfohlen für Produktion)

Vercel hostet sowohl das Frontend als auch die Serverless Functions (API-Proxy, Stripe, Relay).

```bash
vercel deploy --prod
```

### Netlify (Alternative, nur Frontend)

1. Gehe zu https://netlify.com
2. Ziehe `index.html` direkt ins Dashboard (Drag & Drop)
3. Fertig – du erhältst eine öffentliche URL (ohne KI-Funktionen)

---

## Datenschutz & Sicherheit

- **Alle Schüler- und Notendaten** verbleiben ausschliesslich im Browser des Benutzers (IndexedDB). Es werden keine personenbezogenen Daten an Server übertragen, ausser den anonymisierten Prüfungsscans für die KI-Korrektur.
- **Der `ANTHROPIC_API_KEY`** wird ausschliesslich serverseitig in Vercel Environment Variables gespeichert. Er ist nie im Browser oder Frontend-Code vorhanden.
- **Lizenzkeys** werden im `localStorage` des Browsers gecacht, nicht im Klartext übertragen.
- **Stripe-Zahlungsdaten** werden nie von der App verarbeitet – Stripe hostet das Checkout-UI vollständig.
- **IP-Rate-Limiting** für KI-Anfragen: max. 20 Requests/Stunde pro IP (ohne gültige Lizenz).

---

## Lizenzpläne

| Plan    | Korrekturen/Monat | Zielgruppe            |
|---------|-------------------|-----------------------|
| Starter | 100               | Einzellehrperson      |
| Pro     | 500               | Lehrperson + Analytik |
| Max     | 5'000             | Schulen / Teams       |

Für lokale Entwicklung und Tests: `SKIP_LICENSE=true` in `.env` setzen.

---

## Mitmachen

Sieh [CONTRIBUTING.md](CONTRIBUTING.md) für Hinweise zu Bugreports, Feature-Requests und Pull Requests.

---

## Changelog

Sieh [CHANGELOG.md](CHANGELOG.md) für die Versionshistorie.

---

## Lizenz

Dieses Projekt steht unter der [MIT Lizenz](LICENSE).

---

*Entwickelt für Schweizer Schulen – pruefai.ch*
