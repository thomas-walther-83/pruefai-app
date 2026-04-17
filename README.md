# Pruefai – KI-gestützte Prüfungskorrektur

[![MIT Lizenz](https://img.shields.io/badge/Lizenz-MIT-blue.svg)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-yellow.svg)](index.html)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-green.svg)](https://supabase.com)

**Pruefai** ist eine webbasierte Applikation für Lehrpersonen, die Lehrpersonen bei der Korrektur von Prüfungen mithilfe von KI (Claude) unterstützt. Jede Lehrperson hat einen eigenen, sicheren Login (Supabase Auth) und sieht ausschliesslich ihre eigenen Daten.

---

## Funktionen

- **Multi-Lehrer-Betrieb** – Jede Lehrperson hat einen eigenen Account, vollständige Datentrennung via Row Level Security
- Mehrseiten-Scan-Support – Prüfungen als Fotos oder Scans hochladen (mehrseitig)
- **Mobile-Kamera-Upload** – Direkter Kamerazugriff auf dem Smartphone, automatische Bildkomprimierung
- KI-Korrektur – Automatische Bewertung mit Claude AI (API-Key sicher auf Server)
- Schweizer Notensystem – Noten 1.0–6.0, Bestehensgrenze 4.0
- Klassenverwaltung – Klassen, Schüler, Fächer organisieren
- **Lernstoff-Upload** – Musterlösungen, Aufgabenstellungen als Dokumente hinterlegen
- PDF-Export – Notenlisten und Korrekturen als PDF exportieren
- **PWA** – Installierbar als App auf dem Gerät, Mobile Bottom-Navigation, FAB

---

## Tech-Stack

| Komponente  | Technologie |
|-------------|-------------|
| Frontend    | Vanilla HTML / CSS / JavaScript (kein Build-Schritt) |
| Backend     | Supabase (PostgreSQL + REST API + Auth + Storage) |
| KI          | Anthropic Claude API (Server-Proxy) |
| PDF-Export  | jsPDF (CDN) |
| Auth        | Supabase Auth (Email + Passwort, JWT) |
| Datenschutz | Row Level Security (jeder Lehrer sieht nur seine Daten) |

---

## Schnellstart

### Voraussetzungen

- Supabase-Konto (kostenlos): https://supabase.com
- Vercel-Konto (für Deployment + API-Key-Proxy): https://vercel.com
- Anthropic API-Key (für KI-Korrektur): https://anthropic.com
- Moderner Webbrowser (Chrome, Firefox, Safari, Edge)

### Schritt 1 – Supabase Projekt erstellen

1. Gehe zu https://supabase.com und erstelle ein neues Projekt
2. Notiere dir **Project URL** und **anon public key** (unter Settings → API)
3. Aktiviere **Email Auth** unter Authentication → Providers (Standard: aktiviert)

### Schritt 2 – Datenbank einrichten

Öffne den SQL Editor in Supabase und führe der Reihe nach aus:

1. Inhalt von `supabase/schema.sql` → erstellt alle Tabellen + Trigger
2. Inhalt von `supabase/rls-policies.sql` → setzt Row Level Security Policies

### Schritt 3 – Storage-Buckets erstellen

1. Gehe zu **Storage** im Supabase Dashboard
2. Erstelle **privaten** Bucket: `pruefungsfotos`
3. Erstelle **privaten** Bucket: `lernmaterial`
4. Füge die Storage Policies aus `supabase/rls-policies.sql` (auskommentierter Block am Ende) über das Supabase Dashboard hinzu

### Schritt 4 – Vercel Deployment

```bash
npm install -g vercel
vercel deploy
```

Setze folgende **Environment Variables** in Vercel:

| Variable | Beschreibung |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Dein Anthropic API-Key (sk-ant-...) |
| `ALLOWED_ORIGINS` | Deine Vercel-App-URL, z.B. `https://meine-app.vercel.app` |

> **Wichtig:** Der `ANTHROPIC_API_KEY` wird **nie im Browser gespeichert**. Alle KI-Calls laufen über den serverseitigen Proxy `/api/claude`.

### Schritt 5 – App konfigurieren & ersten Account erstellen

1. Öffne deine Vercel-App-URL
2. Beim ersten Start erscheint der Einrichtungsassistent
3. Trage ein: **Supabase URL** und **Supabase anon Key**
4. Klicke **Weiter** → du gelangst zum Login-Screen
5. Klicke auf **Registrieren** und erstelle deinen Lehrer-Account
6. (Optional) Passe das E-Mail-Template für die Bestätigungs-E-Mail unter Supabase → Authentication → Email Templates an

### Lokal testen (optional)

```bash
git clone https://github.com/thomas-walther-83/pruefai-app.git
cd pruefai-app

# Vercel Dev (für API-Proxy)
npm install -g vercel
vercel dev
# → http://localhost:3000

# Oder einfacher lokaler Server (ohne KI-Funktionen)
python3 -m http.server 8000
# → http://localhost:8000
```

### Bestehende Daten migrieren (vom alten Schema)

Falls du eine bestehende Installation ohne `lehrer_id`-Spalten migrieren möchtest, lies die Anleitung in `supabase/migration.sql`.

---

## Projektstruktur

```
pruefai-app/
├── index.html              # Komplette App (Single-File)
├── ANLEITUNG.md            # Detaillierte Deployment-Anleitung
├── CHANGELOG.md            # Versionshistorie
├── README.md               # Diese Datei
├── package.json            # Projektmetadaten
├── .env.example            # Vorlage für Umgebungsvariablen
├── .gitignore
├── LICENSE
└── supabase/
    ├── schema.sql          # Datenbankschema (PostgreSQL)
    └── rls-policies.sql    # Row Level Security Policies
```

---

## Datenmodell

```
klassen ──< schueler
   │
   └──< fach_klassen >── faecher
   │
   └──< pruefung_klassen >── pruefungen
                                  │
                              eintraege (pro Schüler)
                                  │
                              seiten_uploads (Scans)
```

**Notenskala (Schweizer System):**

| Note | Beschreibung    |
|------|----------------|
| 6.0  | Sehr gut        |
| 5.0  | Gut             |
| 4.5  | Ziemlich gut    |
| 4.0  | Genügend (Bestehensgrenze) |
| 3.5  | Fast genügend   |
| 1.0  | Ungenügend      |

---

## Deployment

### GitHub Pages (empfohlen – automatisch)

Die App wird automatisch via GitHub Actions auf GitHub Pages deployed, sobald du in den `main`-Branch pushst.

**Öffentliche URL:** https://thomas-walther-83.github.io/pruefai-app/

**Einmalige Einrichtung (nur einmal nötig):**

1. Gehe im Repository zu **Settings → Pages**
2. Wähle unter *Source*: **GitHub Actions**
3. Speichern – danach deployt jeder Push auf `main` die App automatisch

### Netlify (Alternative)

1. Gehe zu https://netlify.com
2. Ziehe `index.html` direkt ins Dashboard (Drag & Drop)
3. Fertig – du erhältst eine öffentliche URL

---

## Sicherheitshinweise

- Der Anthropic API-Key wird nur im localStorage des Browsers gespeichert
- Aktiviere in Supabase nur die benötigten RLS-Policies
- In produktiven Umgebungen sollte die App durch Supabase Auth gesichert werden
- Die anon-Key-basierten Policies erlauben derzeit öffentlichen Zugriff

---

## Lizenz

Dieses Projekt steht unter der [MIT Lizenz](LICENSE).

---

*Entwickelt für Schweizer Berufsschulen*
