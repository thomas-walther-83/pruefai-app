"""
Generiert eine umfassende Projekt-Dokumentation für PruefAI als .docx.
"""
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from datetime import date

PRIMARY = RGBColor(0x1A, 0x56, 0xDB)
GREY = RGBColor(0x6B, 0x72, 0x80)
DARK = RGBColor(0x11, 0x18, 0x27)


def set_cell_bg(cell, color_hex):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:fill'), color_hex)
    tc_pr.append(shd)


def add_heading(doc, text, level=1):
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        run.font.color.rgb = PRIMARY if level == 1 else DARK
    return h


def add_kv_table(doc, rows, widths=(4, 12)):
    t = doc.add_table(rows=len(rows), cols=2)
    t.style = 'Light Grid Accent 1'
    for i, (k, v) in enumerate(rows):
        c1, c2 = t.rows[i].cells
        c1.text = ''
        c2.text = ''
        p1 = c1.paragraphs[0].add_run(k)
        p1.bold = True
        c2.paragraphs[0].add_run(str(v))
        c1.width = Cm(widths[0])
        c2.width = Cm(widths[1])


def add_table(doc, header, rows, col_widths=None):
    t = doc.add_table(rows=1 + len(rows), cols=len(header))
    t.style = 'Light Grid Accent 1'
    hdr = t.rows[0].cells
    for i, h in enumerate(header):
        hdr[i].text = ''
        r = hdr[i].paragraphs[0].add_run(h)
        r.bold = True
        set_cell_bg(hdr[i], '1A56DB')
        for run in hdr[i].paragraphs[0].runs:
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for ri, row in enumerate(rows, 1):
        for ci, cell_text in enumerate(row):
            t.rows[ri].cells[ci].text = str(cell_text)
    if col_widths:
        for ri in range(len(t.rows)):
            for ci, w in enumerate(col_widths):
                t.rows[ri].cells[ci].width = Cm(w)


doc = Document()

# Seitenränder
for section in doc.sections:
    section.top_margin = Cm(2.0)
    section.bottom_margin = Cm(2.0)
    section.left_margin = Cm(2.2)
    section.right_margin = Cm(2.2)

# ── Titelseite ────────────────────────────────────────────────────────
title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
title.paragraph_format.space_before = Cm(6)
r = title.add_run('PruefAI')
r.font.size = Pt(48)
r.font.color.rgb = PRIMARY
r.bold = True

sub = doc.add_paragraph()
sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = sub.add_run('KI-gestützte Korrektur handschriftlicher Prüfungen')
r.font.size = Pt(16)
r.font.color.rgb = GREY

sub2 = doc.add_paragraph()
sub2.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = sub2.add_run('Projekt-Dokumentation')
r.font.size = Pt(20)
r.bold = True

meta = doc.add_paragraph()
meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
meta.paragraph_format.space_before = Cm(4)
r = meta.add_run(f'Stand: {date.today().strftime("%d. %B %Y")}\n')
r.font.size = Pt(11)
r.font.color.rgb = GREY
r = meta.add_run('Verantwortlicher: Thomas Walther, Schweiz\n')
r.font.size = Pt(11)
r.font.color.rgb = GREY
r = meta.add_run('Kontakt: info@pruefai.ch\n')
r.font.size = Pt(11)
r.font.color.rgb = GREY
r = meta.add_run('Repository: github.com/thomas-walther-83/pruefai-app')
r.font.size = Pt(11)
r.font.color.rgb = GREY

doc.add_page_break()

# ── Inhaltsverzeichnis (Platzhalter) ─────────────────────────────────
add_heading(doc, 'Inhaltsverzeichnis', level=1)
toc_p = doc.add_paragraph()
fld = OxmlElement('w:fldSimple')
fld.set(qn('w:instr'), r'TOC \o "1-3" \h \z \u')
toc_p._p.append(fld)
note = doc.add_paragraph()
r = note.add_run('(Inhaltsverzeichnis aktualisieren: Rechtsklick → "Felder aktualisieren" oder F9)')
r.italic = True
r.font.color.rgb = GREY
r.font.size = Pt(9)
doc.add_page_break()

# ── 1. Executive Summary ─────────────────────────────────────────────
add_heading(doc, '1. Executive Summary', level=1)
doc.add_paragraph(
    'PruefAI ist eine Schweizer Indie-SaaS-Lösung für Lehrpersonen, die handschriftliche '
    'Prüfungen mit Hilfe von KI (Anthropic Claude) korrigieren wollen. Die App ist datenschutz-'
    'fokussiert nach nDSG ausgelegt: Schülernamen, Noten und Korrekturen bleiben lokal in '
    'der Browser-Datenbank (IndexedDB) bzw. – optional – in einem vom Nutzer gewählten lokalen '
    'Ordner. Nur das Prüfungsbild geht kurzzeitig und ohne identifizierende Metadaten '
    '(Pseudonymisierung) an die KI.'
)
doc.add_paragraph('Kerneckpunkte:').paragraph_format.space_after = Pt(0)
for li in [
    'Zielgruppe: einzelne Lehrpersonen (B2C) an Schweizer Schulen aller Stufen.',
    'Schweizer Notensystem: 1.0–6.0 in 0.5er-Schritten, Bestehensgrenze 4.0.',
    'Pricing: Starter (CHF 9 / 50 Korrekturen), Pro (CHF 19 / 300), Max (CHF 49 / 1500).',
    '"1 Korrektur = bis zu 12 Seiten", längere Arbeiten anteilig.',
    'Indie-Solo-Operation; kein Konzern, keine externen Investoren.',
    'Architektur ohne zentrales Backend für Schülerdaten; Stripe für Abos; lokale Speicherung primär.',
]:
    doc.add_paragraph(li, style='List Bullet')

# ── 2. Architektur ───────────────────────────────────────────────────
add_heading(doc, '2. Architektur', level=1)

add_heading(doc, '2.1 Überblick', level=2)
doc.add_paragraph(
    'PruefAI ist eine Single-Page-Web-App, die vollständig im Browser läuft. Sie verwendet '
    'kein Front-End-Framework — die gesamte UI ist Vanilla-HTML/CSS/JS in einer einzigen '
    'Datei `app.html` (~4700 Zeilen). Dies hält die Wartung übersichtlich und vermeidet '
    'Build-Pipeline-Komplexität. Der serverseitige Anteil sind Vercel-Serverless-Functions '
    'in `api/` (11 Endpoints, alle in Node.js geschrieben).'
)

add_heading(doc, '2.2 Datenfluss', level=2)
add_table(doc,
    header=['Schritt', 'Wo', 'Was'],
    rows=[
        ['1. Lehrperson erfasst Klassen/Schüler', 'Browser', 'IndexedDB (lokal) + optional FS-Ordner-Spiegel'],
        ['2. Prüfung fotografieren / scannen', 'Browser oder Handy via QR', 'Bild in IndexedDB; bei Handy-Upload kurz über Upstash Redis (TTL 10 Min)'],
        ['3. KI-Korrektur starten', 'Browser → /api/claude → Anthropic', 'Bild + Prüfungsmetadaten OHNE Schülername (Pseudonymisierung)'],
        ['4. Ergebnis bewerten und ggf. anpassen', 'Browser', 'Strukturierter Bericht mit Aufgaben/Teilaufgaben, Punkten, Begründung, Verbesserung'],
        ['5. Note bestätigen / Word herunterladen', 'Browser', '.docx im Browser generiert, niemals auf Server'],
        ['6. Abo / Lizenz / Verbrauch', 'Browser ↔ Stripe via /api/*', 'Customer-Metadaten in Stripe'],
        ['7. Transaktionale E-Mails', '/api/capture-lead, /api/contact-enterprise → Resend', 'Welcome / Antwort-Mails'],
    ],
    col_widths=[5, 5, 7])

add_heading(doc, '2.3 Lokale Speicherung', level=2)
doc.add_paragraph(
    'Alle persönlichen Daten der Schüler bleiben primär in der Browser-Datenbank (IndexedDB). '
    'Zusätzlich kann der Nutzer auf Chromium-Browsern (Chrome / Edge / Opera) via File System '
    'Access API einen lokalen Ordner wählen. PruefAI legt darin folgende Struktur ab:'
)
mono = doc.add_paragraph('PruefAI/\n  data/klassen.json, schueler.json, pruefungen.json, eintraege.json, ...\n  files/seiten/<eintragsId>/<seitennummer>.<ext>\n  files/lernmaterial/<id>.<ext>')
for run in mono.runs:
    run.font.name = 'Consolas'
    run.font.size = Pt(9)
doc.add_paragraph(
    'Liegt der Ordner in iCloud Drive, Dropbox oder OneDrive, ergibt sich automatisch '
    'Multi-Device-Synchronisation und Cloud-Backup, ohne dass PruefAI dafür eigene Server '
    'betreibt. Safari- und Firefox-Nutzer bleiben auf IndexedDB-only; ein Onboarding-Hinweis '
    'empfiehlt einen Chromium-Browser für die optimale Datenablage.'
)

add_heading(doc, '2.4 IndexedDB-Schema', level=2)
doc.add_paragraph(
    'Die App nutzt IndexedDB als lokale Datenbank mit folgenden Object-Stores:'
)
for li in [
    'lehrer, klassen, schueler, faecher, fach_klassen',
    'pruefungen, pruefung_klassen, eintraege (Korrekturen)',
    'seiten_uploads (Prüfungsbilder), lernmaterial (Vorlagenprüfung / Musterlösung / Material)',
    '_files (Blob-Storage für Bilder und Dokumente)',
    'rubrics (Pro), textbausteine (Pro)',
]:
    doc.add_paragraph(li, style='List Bullet')

add_heading(doc, '2.5 Service Worker', level=2)
doc.add_paragraph(
    'PruefAI ist eine PWA (Progressive Web App). Der Service Worker (`sw.js`, aktuelle '
    'Cache-Version `pruefai-v20`) cached die App-Shell und ermöglicht den Offline-Betrieb '
    'für die meisten Funktionen (KI-Korrektur und Stripe-Operationen brauchen weiterhin '
    'Internet). Auf iOS/Android kann die App über "Zum Home-Bildschirm hinzufügen" wie eine '
    'native App installiert werden (PWA-Manifest in `manifest.json`).'
)

# ── 3. Tech-Stack & Integrationen ────────────────────────────────────
add_heading(doc, '3. Tech-Stack und integrierte Tools', level=1)

add_heading(doc, '3.1 Front-End', level=2)
add_kv_table(doc, [
    ('Sprache', 'Vanilla HTML / CSS / JavaScript (ES2020+, async/await, kein Framework)'),
    ('Datei-Aufbau', 'Eine HTML-Datei (app.html) plus eigenständige Rechts-/Compliance-Seiten'),
    ('Lokale DB', 'IndexedDB'),
    ('Datei-Speicher (optional)', 'File System Access API'),
    ('Service Worker', 'App-Shell-Cache, PWA-Manifest'),
    ('Word-Export', 'Eigener OOXML-Generator inkl. ZIP-Implementation (ohne externe Lib)'),
    ('Schlüssel-Bibliotheken (extern)', 'jsPDF + jspdf-autotable für PDF-Noten-Export; qrcode.min.js für QR-Codes'),
])

add_heading(doc, '3.2 Server-Side (Vercel Serverless-Functions)', level=2)
add_table(doc,
    header=['Endpoint', 'Zweck'],
    rows=[
        ['/api/claude', 'Proxy zur Anthropic-API; Lizenz-Validierung; 12-Seiten-Regel; Trial-Token'],
        ['/api/stripe-checkout', 'Erstellt Stripe-Checkout-Session für Abo-Abschluss'],
        ['/api/stripe-webhook', 'Empfängt Stripe-Events (Abo aktiviert / gekündigt / Zahlung fehlgeschlagen)'],
        ['/api/stripe-portal', 'Leitet zum Stripe Billing Portal weiter'],
        ['/api/validate-license', 'Prüft Lizenzschlüssel beim App-Start gegen Stripe'],
        ['/api/get-license', 'Holt den Lizenzschlüssel nach erfolgreichem Checkout via Session-ID'],
        ['/api/relay', 'Foto-Relay für QR-Mobile-Upload (Upstash Redis, TTL 10 Min)'],
        ['/api/capture-lead', 'Trial-Aktivierung; sendet Welcome-Mail via Resend'],
        ['/api/contact-enterprise', 'Enterprise-Anfragen; sendet Mail via Resend'],
        ['/api/admin-revoke', 'Manuelles Sperren einer Lizenz (z.B. bei Leak)'],
        ['/api/config', 'Liefert App-Konfiguration (Schulname etc.)'],
    ],
    col_widths=[5, 12])

add_heading(doc, '3.3 Externe Dienste', level=2)
add_table(doc,
    header=['Anbieter', 'Funktion', 'Standort', 'Drittland-Grundlage'],
    rows=[
        ['Anthropic PBC', 'KI-Korrektur (Claude Haiku 4.5)', 'USA', 'SCCs + Swiss-U.S. DPF'],
        ['Stripe Payments Europe Ltd.', 'Zahlungsabwicklung, Abos', 'Irland (EU)', 'adäquat'],
        ['Vercel Inc.', 'Hosting, Serverless, statisch', 'USA / RZ Frankfurt', 'SCCs + Swiss-U.S. DPF'],
        ['Upstash Inc.', 'QR-Foto-Relay (TTL 10 Min)', 'USA', 'SCCs (DPA unterzeichnet)'],
        ['Resend (Drogon, Inc.)', 'Transaktionale E-Mails', 'USA', 'SCCs (DPA unterzeichnet)'],
    ],
    col_widths=[3.8, 5, 3.5, 4.7])

# ── 4. Features ──────────────────────────────────────────────────────
add_heading(doc, '4. Features im Detail', level=1)

add_heading(doc, '4.1 Verwaltung', level=2)
for li in [
    'Klassen mit Berufsschulspezifik (Beruf, Lehrjahr) oder ohne (Gymnasium / Sek / Primar)',
    'Schüler mit Klassenzuordnung, optionaler Schülernummer; CSV-Import',
    'Fächer mit Kürzel und KI-Profil (Mathematik / Sprache / NWi / ICT / Wirtschaft)',
    'Prüfungen mit Datum, Klassen-Zuordnung, Notenformel und Notenrundung',
    'Filter und Sortierung in allen vier Listen (einheitlich aufgebaut)',
]:
    doc.add_paragraph(li, style='List Bullet')

add_heading(doc, '4.2 Strukturierte Unterlagen pro Prüfung', level=2)
doc.add_paragraph(
    'Im Prüfungs-Dialog können drei Dokumenttypen hochgeladen werden:'
)
for li in [
    'Vorlagenprüfung (Pflicht) — die leere Prüfung; daraus lässt sich per "Punkteschema analysieren" automatisch das Punkteraster (max. Punkte, Aufgaben/Teilaufgaben, Punktevergabe-Logik) extrahieren.',
    'Musterlösung (empfohlen) — wird der KI mit erhöhter Priorität als Korrektur-Referenz übergeben.',
    'Weitere Unterlagen (optional) — Lernstoff, Skript, fachlicher Kontext.',
]:
    doc.add_paragraph(li, style='List Bullet')

add_heading(doc, '4.3 KI-Korrektur', level=2)
for li in [
    'Modell: Claude Haiku 4.5 von Anthropic via /api/claude-Proxy',
    'Prompt-Caching für Musterlösung/Vorlagenprüfung (signifikante Kostenreduktion bei mehreren Schülern derselben Prüfung)',
    'Pseudonymisierung: Schülername wird NICHT an die KI übermittelt',
    'Sorgfaltsregeln: Die KI darf nicht vermuten; unleserliche oder fachlich unklare Stellen werden mit dem Feld "unsicher" markiert; in Begründung wird beschrieben, was unklar ist',
    'Page-Counting: 1 Korrektur = bis zu 12 Seiten; längere Arbeiten zählen anteilig (server-seitig durchgesetzt; in der App ein Bestätigungsdialog bei >1 Einheit)',
    'Strukturierter Bericht: pro Aufgabe und Teilaufgabe Punkte, Begründung ("wofür gibt es Punkte"), Verbesserung ("was wäre für mehr Punkte nötig")',
    'Mensch-im-Loop: Lehrperson überprüft, korrigiert und bestätigt — finale Note liegt immer bei der Lehrperson',
]:
    doc.add_paragraph(li, style='List Bullet')

add_heading(doc, '4.4 Berichts-Darstellung', level=2)
for li in [
    'Ergebnis-Dialog: editierbar, Banner oben mit Anzahl unsicherer Stellen, gelb hinterlegte (Teil-)Aufgaben',
    'Word-Export (.docx) eigenständig generiert; Tabelle mit Aufgabe/Teilaufgabe · Punkte · Begründung · Verbesserung; unsichere Zeilen gelb hervorgehoben',
    'PDF-Export der Notenliste pro Prüfung/Klasse',
    'CSV-Export für Excel-Übernahme',
]:
    doc.add_paragraph(li, style='List Bullet')

add_heading(doc, '4.5 Mobile Foto-Upload', level=2)
doc.add_paragraph(
    'Beim Upload-Dialog kann die Lehrperson statt vom Computer auch ein Smartphone nutzen: '
    'PruefAI zeigt einen QR-Code → Smartphone scannt → öffnet eine mobile Upload-Seite → '
    'Foto wird über Upstash Redis (verschlüsselt im Transit, TTL 10 Minuten) zum PC '
    'übergeben. Sobald der PC die Fotos empfangen hat, werden sie aus Upstash gelöscht.'
)

add_heading(doc, '4.6 Pro-Features', level=2)
for li in [
    'Bewertungsraster (Rubrics) mit fachspezifischen Kriterien',
    'Qualitätscheck als zweite KI-Meinung bei Grenzfall-Noten',
    'Analytik / Fehlerkatalog (Notentrends, häufige Fehler-Stichwörter)',
    'Hilfe-Chatbot zur Bedienung',
    'Feedback-Textbausteine in den Einstellungen',
]:
    doc.add_paragraph(li, style='List Bullet')

# ── 5. Datenschutz & Compliance ──────────────────────────────────────
add_heading(doc, '5. Datenschutz und Compliance', level=1)

add_heading(doc, '5.1 Rechtlicher Rahmen', level=2)
doc.add_paragraph(
    'PruefAI ist nDSG-konform (revidiertes Schweizer Datenschutzgesetz, in Kraft seit '
    '1. September 2023). Bei Kunden aus dem EU/EWR-Raum gilt zusätzlich die DSGVO. Die '
    'Rollen-Aufteilung:'
)
for li in [
    'Verantwortliche/r für Lehrer- und Kundendaten: PruefAI (Thomas Walther, Schweiz)',
    'Auftragsbearbeiterin für Schülerdaten: PruefAI im Auftrag der jeweiligen Lehrperson/Schule',
    'Sub-Auftragsbearbeiter: Anthropic, Stripe, Vercel, Upstash, Resend (siehe Tabelle Abschnitt 3.3)',
]:
    doc.add_paragraph(li, style='List Bullet')

add_heading(doc, '5.2 Schlüssel-Massnahmen', level=2)
for li in [
    'Pseudonymisierung: Schülername bleibt lokal; der KI-Dienst erfährt nicht, zu welcher Person die Arbeit gehört',
    'Lokale Speicherung statt zentralem Backend (IndexedDB; optional File System Access API)',
    'Datenminimierung: nur Bild + Prüfungsmetadaten an die KI; keine Klassenlisten, keine Namen',
    'TLS in Transit überall; HMAC-SHA256-signierte Trial-Tokens',
    'Bild-Komprimierung vor Übertragung (reduziert Übertragungsvolumen und Re-Identifikations-Risiko)',
    'QR-Foto-Relay mit TTL 10 Minuten und automatischer Löschung',
    'Onboarding-Bestätigung der Rechtsgrundlage durch die Lehrperson (einmalig)',
    'App-Hinweis "Namen auf Blatt abdecken" im Upload-Dialog (zusätzliche Massnahme zur Pseudonymisierung im Prompt)',
    'Sub-Auftragsbearbeiter mit DPAs / AVVs gesichert (siehe Abschnitt 5.4)',
]:
    doc.add_paragraph(li, style='List Bullet')

add_heading(doc, '5.3 Öffentliche Compliance-Seiten', level=2)
add_table(doc,
    header=['URL', 'Inhalt'],
    rows=[
        ['pruefai.ch/datenschutz', 'Datenschutzerklärung nach nDSG/DSGVO'],
        ['pruefai.ch/avv', 'Auftragsverarbeitungsvertrag für Lehrpersonen/Schulen'],
        ['pruefai.ch/agb', 'Allgemeine Geschäftsbedingungen'],
        ['pruefai.ch/subprocessors', 'Vollständige Sub-Auftragsbearbeiter-Übersicht'],
        ['pruefai.ch/bearbeitungsverzeichnis', 'Verzeichnis nach Art. 12 nDSG / Art. 30 DSGVO'],
        ['pruefai.ch/dsfa', 'Datenschutz-Folgenabschätzung für die KI-Korrektur'],
    ],
    col_widths=[5.5, 11])

add_heading(doc, '5.4 Sub-Auftragsbearbeiter und DPA-Status', level=2)
add_table(doc,
    header=['Anbieter', 'DPA-Status'],
    rows=[
        ['Anthropic PBC', '✓ automatisch über Commercial Terms'],
        ['Stripe Payments Europe Ltd.', '✓ automatisch via TOS (stripe.com/dpa)'],
        ['Vercel Inc.', '○ Hobby-Plan: öffentliche DPA + Trust Center (kein gegengezeichneter)'],
        ['Upstash Inc.', '✓ unterzeichnet 2026-05-29 (PDF im Repo: docs/compliance/dpa-archive/)'],
        ['Resend (Drogon, Inc.)', '✓ DocuSign-signiert 2026-05-29 (PDF im Repo)'],
    ],
    col_widths=[6, 11])

add_heading(doc, '5.5 Interne Compliance-Dokumente (Repo: docs/compliance/)', level=2)
for li in [
    'README.md — Verzeichnis aller Compliance-Dokumente',
    'bearbeitungsverzeichnis.md — interne Quelle der öffentlichen Bearbeitungsverzeichnis-Seite',
    'dsfa-ki-verarbeitung.md — DSFA für die KI-Verarbeitung',
    'subprocessors.md — Sub-Bearbeiter-Quelle',
    'dpa-checklist.md — Status pro Anbieter mit konkreten Beschaffungsschritten',
    'meldeplan.md — Runbook für Datenschutzverletzungen (Art. 24 nDSG, 72-h-Frist)',
    'dpa-archive/ — signierte DPA-PDFs (Upstash, Resend)',
]:
    doc.add_paragraph(li, style='List Bullet')

add_heading(doc, '5.6 Rechte der betroffenen Personen', level=2)
doc.add_paragraph(
    'Anfragen zur Auskunft, Berichtigung, Löschung oder Datenübertragbarkeit gehen an '
    'info@pruefai.ch. Bearbeitungsfrist: 30 Tage. Lokale Schülerdaten (in IndexedDB / im '
    'gewählten Ordner) kann die Lehrperson jederzeit selbst exportieren oder löschen. '
    'Kundendaten beim Anbieter (E-Mail, Lizenz, Stripe-Customer) werden auf Anfrage gelöscht; '
    'gesetzliche Aufbewahrungsfristen (10 Jahre für Buchungsbelege, Art. 958f OR) bleiben unberührt.'
)

# ── 6. Pricing & Business ────────────────────────────────────────────
add_heading(doc, '6. Pricing und Business-Case', level=1)

add_heading(doc, '6.1 Preismodell', level=2)
add_table(doc,
    header=['Plan', 'Preis', 'Korrekturen/Monat', 'Zielgruppe'],
    rows=[
        ['Starter', 'CHF 9', '50', '1–2 Klassen oder ein Hauptfach'],
        ['Pro', 'CHF 19', '300', 'Mehrere Klassen / mehrere Fächer (Default-Empfehlung)'],
        ['Max', 'CHF 49', '1500', 'Sehr aktive Lehrpersonen / Korrekturphasen Mai–Juli'],
    ],
    col_widths=[2.5, 2, 3.5, 9])
doc.add_paragraph(
    'Verbrauchsregel: 1 Korrektur = 1 Schülerarbeit bis 12 Seiten. Längere Arbeiten zählen '
    'anteilig (13–24 S. = 2 Korrekturen, 25–36 S. = 3, usw.). Diese Regel wird vom Server '
    'durchgesetzt und im FAQ transparent kommuniziert.'
)

add_heading(doc, '6.2 Margen (Annahme Claude Haiku 4.5)', level=2)
doc.add_paragraph(
    'Pro Korrektur ~5 Prüfungsseiten, ca. 0.016 CHF KI-Kosten (Range 0.012–0.025). '
    'Stripe-Gebühren: 2.9 % + CHF 0.30 pro Transaktion.'
)
add_table(doc,
    header=['Plan', 'Marge bei Ø-Nutzung', 'Marge bei Worst-Case'],
    rows=[
        ['Starter (Ø 20 Korr.)', '90 %', '85 % (bei voller 50er-Nutzung)'],
        ['Pro (Ø 150 Korr.)', '83 %', '70 % (bei voller 300er-Nutzung)'],
        ['Max (Ø 975 Korr.)', '65 %', '48 % (bei voller 1500er-Nutzung)'],
    ],
    col_widths=[5, 6, 6])

add_heading(doc, '6.3 Geschäftsmodell', level=2)
for li in [
    'Indie-Solo-SaaS: keine Mitarbeitenden, keine externen Investoren',
    'Fixkosten gering: Vercel-Hobby (gratis bis Skala-Grenze), Domain CHF ~20/Jahr',
    'Break-even rein operativ: < 1 Kunde; Break-even für CHF 5\'000/Mt. Aufwandsentschädigung: ~418 Kunden',
    'Fokus B2C (Einzel-Lehrpersonen); B2B/Schul-Verkauf bewusst zurückgestellt',
]:
    doc.add_paragraph(li, style='List Bullet')

# ── 7. Roadmap ───────────────────────────────────────────────────────
add_heading(doc, '7. Roadmap und offene Punkte', level=1)

add_heading(doc, '7.1 Kurzfristig (nach diesem Aufbau-Sprint)', level=2)
for li in [
    'Real-Test der lokalen Ordner-Speicherung in Chrome/Edge (Funktionsprüfung mit echten Daten)',
    'Real-Test der Unsicher-Markierung mit absichtlich unleserlicher Prüfung',
    'Tabletop-Übung Meldeplan Datenschutzverletzung',
    'Marke "PruefAI" beim IGE eintragen (~CHF 550, ~30 Min Anmeldung)',
]:
    doc.add_paragraph(li, style='List Bullet')

add_heading(doc, '7.2 Mittelfristig', level=2)
for li in [
    'Jahres-Abo in Stripe scharfschalten (12 Mt. zum Preis von 10) — Churn-Reduktion, Cashflow nach vorne',
    'Backup-Reminder für Safari/Firefox-Nutzer (alle 4 Wochen Banner)',
    'Schüler-Pseudonym-Toggle in der App ("Initialen statt Vollname anzeigen")',
    'docs/DATENSCHUTZ.md Legacy-Cleanup',
]:
    doc.add_paragraph(li, style='List Bullet')

add_heading(doc, '7.3 Langfristig / wenn relevant', level=2)
for li in [
    'Bild-seitige Pseudonymisierung (Top-8% des Bildes vor Upload automatisch schwärzen)',
    'Schul-/Fachschaft-Lizenz mit eigenem AVV pro Schule — bei Verlagerung Richtung B2B',
    'Logging-Policy als formales Dokument',
    'Datenpannen-Versicherung (ab ~100 aktiven Kunden)',
    'Periodische externe Sicherheitsprüfung (alle 1–2 Jahre)',
]:
    doc.add_paragraph(li, style='List Bullet')

# ── 8. Anhang ────────────────────────────────────────────────────────
add_heading(doc, '8. Anhang', level=1)

add_heading(doc, '8.1 Repository-Struktur', level=2)
mono = doc.add_paragraph(
    'pruefai-app/\n'
    '  app.html                        ← gesamte SPA-Logik (~4700 Zeilen)\n'
    '  index.html, agb.html, avv.html, datenschutz.html\n'
    '  subprocessors.html, bearbeitungsverzeichnis.html, dsfa.html\n'
    '  checkout-success.html\n'
    '  manifest.json, sw.js, qrcode.min.js\n'
    '  api/                            ← 11 Serverless-Functions\n'
    '  docs/\n'
    '    AGB.md, AVV.md, DATENSCHUTZ.md, marketing-plan.md, ...\n'
    '    compliance/\n'
    '      README.md, dpa-checklist.md, meldeplan.md, ...\n'
    '      dpa-archive/                ← signierte DPA-PDFs\n'
    '  tests/                          ← API-Unit-Tests (Node test runner)\n'
    '    e2e/                          ← Playwright Smoke-Tests\n'
    '  CHANGELOG.md, README.md, package.json, vercel.json'
)
for run in mono.runs:
    run.font.name = 'Consolas'
    run.font.size = Pt(9)

add_heading(doc, '8.2 CI / Build / Deploy', level=2)
for li in [
    'GitHub Actions: HTML-Lint, JSON-Validierung, API-Unit-Tests (Node), Playwright-Smoke-Tests',
    'Vercel Auto-Deploy bei jedem Push auf main; Preview-Deploys für PRs',
    'Service-Worker-Cache-Version bei jedem App-Update inkrementiert',
    'Tests: 118 API-Unit-Tests, mehrere E2E-Smoke-Tests',
]:
    doc.add_paragraph(li, style='List Bullet')

add_heading(doc, '8.3 Wichtige Konfigurations-Werte', level=2)
add_kv_table(doc, [
    ('App-Version', '1.2.0'),
    ('Service-Worker-Cache', 'pruefai-v20'),
    ('Free-Trial-Limit', '3 Korrekturen'),
    ('Page-Counting-Schwelle', '12 Seiten = 1 Einheit'),
    ('Rate-Limit (unlizenziert)', '20 Anfragen / Stunde / IP'),
    ('QR-Foto-Relay-TTL', '10 Minuten'),
    ('FS-Sync-Debounce', '500 ms'),
    ('Vercel max. Function-Duration', '60 s'),
    ('Vercel Body-Size-Limit', '4.5 MB'),
    ('Default-Modell', 'claude-haiku-4-5'),
])

add_heading(doc, '8.4 Kontakt und Verantwortung', level=2)
add_kv_table(doc, [
    ('Verantwortlich', 'Thomas Walther'),
    ('Sitz', 'Schweiz'),
    ('E-Mail', 'info@pruefai.ch'),
    ('Website', 'https://pruefai.ch'),
    ('Repository', 'https://github.com/thomas-walther-83/pruefai-app'),
    ('Aktuelle Version', 'siehe package.json / CHANGELOG.md'),
])

# Footer / Schluss-Notiz
end = doc.add_paragraph()
end.alignment = WD_ALIGN_PARAGRAPH.CENTER
end.paragraph_format.space_before = Cm(2)
r = end.add_run('— Ende der Projekt-Dokumentation —')
r.italic = True
r.font.color.rgb = GREY

doc.save('PruefAI-Projektdokumentation.docx')
print('Dokument erstellt: PruefAI-Projektdokumentation.docx')
print('Grösse:', __import__('os').path.getsize('PruefAI-Projektdokumentation.docx'), 'Bytes')
