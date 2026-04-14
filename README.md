# LernortAI – KI-gestützte Prüfungskorrektur für Berufsschulen

[![MIT Lizenz](https://img.shields.io/badge/Lizenz-MIT-blue.svg)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-yellow.svg)](index.html)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-green.svg)](https://supabase.com)

**LernortAI** ist eine webbasierte Applikation für Schweizer Berufsschulen, die Lehrpersonen bei der Korrektur von Prüfungen mithilfe von KI (Claude) unterstützt. Die App läuft vollständig im Browser und benötigt keinen eigenen Server.

---

## Funktionen

- Mehrseiten-Scan-Support – Prüfungen als Fotos oder Scans hochladen (mehrseitig)
- KI-Korrektur – Automatische Bewertung mit Claude AI
- Schweizer Notensystem – Noten 1.0–6.0, Bestehensgrenze 4.0
- Klassenverwaltung – Klassen, Schüler, Fächer organisieren
- PDF-Export – Notenlisten und Korrekturen als PDF exportieren
- Mobile-optimiert – Responsive Design für Tablets und Smartphones
- PWA-fähig – Installation als App auf dem Gerät möglich
- Datenschutz – Konfiguration lokal im Browser gespeichert (localStorage)

---

## Tech-Stack

| Komponente  | Technologie |
|-------------|-------------|
| Frontend    | Vanilla HTML / CSS / JavaScript (kein Build-Schritt) |
| Backend     | Supabase (PostgreSQL + REST API + Storage) |
| KI          | Anthropic Claude API |
| PDF-Export  | jsPDF (CDN) |
| Auth        | localStorage (App-Passwort) |

---

## Schnellstart

### Voraussetzungen

- Supabase-Konto (kostenlos): https://supabase.com
- Anthropic API-Key (optional, für KI-Korrektur): https://anthropic.com
- Moderner Webbrowser (Chrome, Firefox, Safari, Edge)

### Schritt 1 – Supabase Projekt erstellen

1. Gehe zu https://supabase.com und erstelle ein neues Projekt
2. Notiere dir Project URL und anon public key (unter Settings → API)

### Schritt 2 – Datenbank einrichten

Öffne den SQL Editor in Supabase und führe die folgenden Dateien aus:

1. Inhalt von `supabase/schema.sql` einfügen und ausführen
2. Inhalt von `supabase/rls-policies.sql` einfügen und ausführen

### Schritt 3 – Storage-Bucket erstellen

1. Gehe zu Storage im Supabase Dashboard
2. Erstelle einen neuen Bucket: `pruefungsfotos`
3. Setze ihn auf Privat (private)
4. Füge die Storage-Policies aus `supabase/rls-policies.sql` (auskommentierter Teil) hinzu

### Schritt 4 – App öffnen und konfigurieren

1. Öffne `index.html` direkt im Browser oder deploye sie auf Netlify/Vercel
2. Beim ersten Start erscheint der Einrichtungsassistent
3. Trage ein: Supabase URL, Supabase anon Key, Anthropic API-Key (optional), App-Passwort

### Schritt 5 – Lokal testen (optional)

```bash
git clone https://github.com/thomas-walther-83/pruefai-app.git
cd pruefai-app

# Einfacher lokaler Server (Python)
python3 -m http.server 8000
# → http://localhost:8000
```

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
