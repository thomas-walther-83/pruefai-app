# Beitragen zu Pruefai

Vielen Dank für dein Interesse an Pruefai! Dieses Dokument erklärt, wie du Fehler meldest, Feature-Requests einreichst und Pull Requests erstellst.

---

## Backlog-Prozess

Der Backlog wird ausschliesslich über **GitHub Issues** verwaltet.

### Bug melden

1. Prüfe zunächst, ob das Problem bereits als [Issue](https://github.com/thomas-walther-83/pruefai-app/issues) gemeldet wurde.
2. Erstelle ein neues Issue mit dem Label **`bug`**.
3. Beschreibe:
   - Schritte zur Reproduktion
   - Erwartetes Verhalten
   - Tatsächliches Verhalten
   - Browser und Betriebssystem

### Feature-Request einreichen

1. Erstelle ein neues Issue mit dem Label **`enhancement`**.
2. Beschreibe den Anwendungsfall und warum die Funktion hilfreich wäre.
3. Hänge Screenshots oder Mockups an, wenn möglich.

### Prioritäten

Issues werden mit folgenden Labels priorisiert:

| Label         | Bedeutung                                       |
|---------------|-------------------------------------------------|
| `prio-kritisch` | Sicherheitslücke oder Datenverlust             |
| `prio-hoch`   | Kernfunktion beeinträchtigt oder blockiert      |
| `prio-mittel` | Verbesserung, die viele Nutzer betrifft         |
| `prio-niedrig`| Nice-to-have, kein unmittelbarer Handlungsbedarf|

---

## Entwicklungsworkflow

### Voraussetzungen

- Node.js ≥ 18
- Vercel CLI (`npm install -g vercel`)

### Lokale Entwicklung starten

```bash
# Klonen
git clone https://github.com/thomas-walther-83/pruefai-app.git
cd pruefai-app

# Umgebungsvariablen einrichten
cp .env.example .env
# → ANTHROPIC_API_KEY, ALLOWED_ORIGINS, SKIP_LICENSE=true eintragen

# Vercel Dev starten (mit API-Proxy)
vercel dev
```

### HTML linten

```bash
npm run lint
```

### Pull Request erstellen

1. Erstelle einen Feature-Branch: `git checkout -b feature/mein-feature`
2. Mache deine Änderungen (nur minimale, gezielte Eingriffe)
3. Führe `npm run lint` aus und behebe Warnungen
4. Committe mit aussagekräftiger Nachricht
5. Öffne einen Pull Request gegen `main`
6. Verlinke das zugehörige Issue (`Closes #42`)

---

## Code-Konventionen

- **Kein Build-Schritt** – Die App ist bewusst als Single-File Vanilla JS gehalten.
- **Keine neuen npm-Abhängigkeiten** – Nur wenn zwingend nötig.
- **Kommentare auf Deutsch** – Konsistent mit dem bestehenden Code.
- **Keine personenbezogenen Daten im Code** – Schüler- und Lehrerdaten verbleiben im Browser.

---

## Sicherheitslücken melden

Sicherheitslücken bitte **nicht** als öffentliches GitHub Issue melden, sondern direkt per E-Mail an: **info@pruefai.ch**

---

## Lizenz

Mit deinem Beitrag stimmst du zu, dass dein Code unter der [MIT Lizenz](LICENSE) veröffentlicht wird.
