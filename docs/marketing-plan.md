# Pruefai – Marketing- & Growth-Plan

_Stand: 18. Mai 2026 · Autor: Senior Marketing & Growth Director (Audit)_
_Adressat: Thomas Walther, Pruefai_

---

## TL;DR – Was als Nächstes (Reihenfolge):

1. **Landing-Page-Fixes diese Woche** (4–6 h): Hero-Headline auf konkretes Schweizer Lehrer-Pain-Statement umschreiben, „nDSG" statt „DSGVO" überall, drei echte Lehrer-Zitate (auch wenn vom Beta-Test) als Social Proof, `/landing` zur Default-Route machen (Vercel-Rewrite ändern – `/` zeigt aktuell die App, nicht die Verkaufsseite).
2. **SEO-Grundgerüst in 1 Tag** (6–8 h): `sitemap.xml`, `robots.txt`, JSON-LD `SoftwareApplication` + `FAQPage`, canonical-URLs, OG-Image (1200×630). Aktuell ist null von dem da → bei pruefai.ch wird Google nichts ranken.
3. **Ein Direkt-Outreach-Sprint** (2 Wochen): 50 Schulleitungen + 100 Lehrpersonen handverlesen über LinkedIn/E-Mail mit „Gratis Pro-Plan bis Sommerferien gegen schriftliches Testimonial". Du brauchst 5–10 Logos/Zitate, bevor irgendein Kanal-Investment Sinn ergibt. SmartScreen-Block ist ein Symptom, nicht das Hauptproblem – das Hauptproblem ist „null sozialer Beweis".

---

## 1. Landing-Page (`landing.html`)

### Befund: Above-the-Fold

Die aktuelle Hero ist generisch-funktional, nicht emotional-spezifisch. „Prüfungen korrigieren in 10 Minuten statt 2 Stunden" ist okay, aber:

- **Käufer-Identifikation fehlt** – ein Sek-Lehrer in Biel weiss nicht sofort „das ist für mich". Du bedienst 4 Schultypen (Berufsschule, Gym, Sek, Primar), willst aber in der Headline nicht „für alle" sagen, weil das niemanden trifft.
- **Trust-Anker schwach**: „🇨🇭" als Emoji-Badge ist nett, aber das eigentliche Killer-Verkaufsargument – **„Daten bleiben in deinem Browser, kein Cloud-Backend"** – kommt nicht above the fold vor. Das ist gegenüber Konkurrenz (z. B. fobizz, ChatGPT-basierten Tools) ein USP.
- **„DSGVO-konform"** ist falsch positioniert: Schweizer Lehrpersonen interessiert primär **nDSG** und **kantonale Datenschutzrichtlinien für Schülerdaten** – DSGVO klingt wie „EU-Tool, das halt auch hier funktioniert".
- **CTA-Hierarchie verkehrt herum**: „Jetzt loslegen →" führt zu `#preise` (Stripe-Kauf). „App testen" (sekundär) führt direkt in die App, wo 3 Gratis-Korrekturen warten. **Das ist die falsche Priorisierung.** Niemand kauft für 9 CHF/Monat, ohne das Tool einmal zu sehen. Primary-CTA muss „Gratis testen – 3 Korrekturen ohne Anmeldung" sein.

### Befund: Friction / Klicks bis Kauf

Aktuell: Landing → `#preise` (Scroll) → Stripe-Checkout → checkout-success → Lizenz manuell kopieren → App öffnen → Einstellungen → Lizenz einfügen → Speichern.

**Das sind 7+ Schritte nach dem Kauf.** Die Lizenzschlüssel-Aktivierung via Copy-Paste-in-Settings ist 2018er-Indie-Hacker-UX. Verbesserung siehe Abschnitt 3 (Conversion-Funnel).

### Befund: Pricing-Tabelle

- **Pro ist als „Beliebt" markiert** – gut. Visuell hebt sich die Karte aber zu schwach ab (gleicher Border-Style ausser blau). Schatten und Skalierung könnten stärker sein.
- **Mengen-Anker fehlt**: 50 / 300 / 1500 wirkt willkürlich. Übersetze in Lehrer-Sprache: „≈ 2 Klassen × 1 Prüfung/Monat", „≈ alle deine Klassen", „auch für Fachschaft/Stufen-Team".
- **Anker-Plan**: Pro ist gut positioniert. Aber der Max-Plan ist mit 49 CHF/Monat für eine Einzelperson schwer zu rechtfertigen (1500 Korrekturen = ~80/Woche, das schafft kein einzelner Lehrer). Max sollte als **Fachschafts-/Schul-Lizenz** umpositioniert oder ein expliziter „Schule" / „Fachschaft"-Plan dazu.
- **Jährliche Bezahlung fehlt komplett.** Bei 9–19 CHF/Monat ist der Cashflow-Vorteil real (Stripe-Fees sinken pro Transaktion, du bekommst 12 Monate Cash, Churn sinkt strukturell).

### Befund: FAQ

5 Fragen, kein einziges Thema dabei, das eine **skeptische Schulleitung** überzeugt:

- „Was passiert mit den Schülerprüfungen technisch genau?" (Datenfluss-Diagramm)
- „Wird der LCH / mein Kanton das akzeptieren?"
- „Wer haftet, wenn die KI falsch korrigiert?"
- „Wie unterscheidet sich Pruefai von ChatGPT / fobizz / Co-Pilot?"
- „Kann ich Pruefai mit Schulgeld bezahlen oder muss ich es privat?"
- „Funktioniert es mit Mathematik / Formeln / Skizzen?"
- „Was mache ich, wenn ein Schüler die KI-Korrektur anficht?"

### Befund: Mobile

Mobil ist okay (responsive Grid kollabiert sauber), aber:
- Hero-CTA-Buttons in Reihe auf 360 px → eng. `flex-direction: column` auf < 480 px wäre sauberer.
- Sticky-Nav nimmt mobil 56 px – auf iPhone SE schon viel. Vertretbar.

### Konkrete Verbesserungen mit Copy/Code

**Was:** Hero komplett umschreiben.
**Warum:** Aktuelle Hero spricht nicht klar an, hat kein nDSG-Signal, falsche CTA-Reihenfolge.
**Wie:** Folgender Block ersetzt Zeile 298–308:

```html
<section class="hero">
  <div class="hero__badge">🇨🇭 Schweizer Notenskala · nDSG-konform · Daten lokal</div>
  <h1>Korrigieren Sie eine Klassenarbeit in <span>10 Minuten</span> – nicht am Sonntagabend.</h1>
  <p class="hero__sub">Pruefai scannt handschriftliche Prüfungen, korrigiert mit Claude AI nach Schweizer Notensystem (1–6) und liefert Feedback pro Aufgabe. Alle Schülerdaten bleiben in Ihrem Browser – kein Cloud-Upload.</p>
  <div class="hero__ctas">
    <a href="./index.html" class="btn-primary-lg">3 Prüfungen gratis korrigieren →</a>
    <a href="#preise" class="btn-outline-lg">Preise ansehen</a>
  </div>
  <p class="hero__note">Keine Registrierung · Keine Kreditkarte · Funktioniert sofort im Browser</p>
</section>
```

**Aufwand:** 30 Min.

---

**Was:** Trust-Strip direkt unter Hero einfügen.
**Warum:** Schweizer Lehrer kaufen kein KI-Tool, wenn sie nicht sehen, dass andere Schweizer Lehrer es nutzen / es rechtlich abgesichert ist.
**Wie:** Neuer Section-Block direkt nach `</section>` der Hero:

```html
<section style="background:#fff;border-bottom:1px solid var(--border);padding:1.25rem 1.5rem">
  <div class="container" style="display:flex;flex-wrap:wrap;justify-content:center;gap:2rem;align-items:center;font-size:.85rem;color:var(--text-muted)">
    <span>🛡️ <strong>nDSG-konform</strong> (Schweizer Datenschutzgesetz)</span>
    <span>🇨🇭 <strong>Schweizer Anbieter</strong> · Sitz Schweiz</span>
    <span>🔒 <strong>Lokale Speicherung</strong> · IndexedDB im Browser</span>
    <span>📜 <strong>AVV verfügbar</strong> für Schulen</span>
  </div>
</section>
```

**Aufwand:** 15 Min.

---

**Was:** Echte Lehrer-Zitate als Section.
**Warum:** Du hast aktuell die Stats „80 % / <10 Min / 1–6 / 100 %" – das sind keine Beweise, das sind Behauptungen. Drei Zitate (auch wenn Beta-Tester) > zehn Stats.
**Wie:** Vor der Pricing-Section einfügen. Hol drei Beta-Lehrer mit Vor-/Nachname, Schultyp, Kanton (Optin per E-Mail). Falls keine vorhanden: dieser Section weglassen, NICHT erfinden. Stattdessen ein ehrliches „Pruefai ist neu – werden Sie einer der ersten 50 Lehrpersonen und erhalten Sie 3 Monate Pro gratis" Beta-Hinweis.

```html
<section class="section">
  <div class="container">
    <div class="section-label">Stimmen aus der Praxis</div>
    <h2 class="section-title">Was Lehrpersonen sagen</h2>
    <div class="value-grid">
      <div class="value-card">
        <p style="font-size:1rem;font-style:italic;margin-bottom:1rem">„Statt am Sonntag 4 Stunden Mathe-Tests zu korrigieren, brauche ich noch 40 Minuten. Die KI-Vorschläge übernehme ich zu ~85 % unverändert."</p>
        <div style="font-size:.85rem;color:var(--text-muted)"><strong>M. K.</strong> · Sek-Lehrer Mathematik · Kanton Zürich</div>
      </div>
      <!-- 2 weitere -->
    </div>
  </div>
</section>
```

**Aufwand:** Code 30 Min., Beschaffung Zitate 2–3 h (Outreach).

---

**Was:** FAQ um 4 Schul-spezifische Fragen erweitern.
**Warum:** Schulleitungen sind die echten Käufer (oder Verhinderer). Sie müssen vor dem Klick auf den CTA Antworten finden.
**Wie:** Vier zusätzliche `<div class="faq-item">` Blöcke (Code-Schema vorhanden in Zeile 502–540):

1. „Ist Pruefai mit den kantonalen Datenschutz-Vorgaben für Schülerdaten kompatibel?" → Verweis auf nDSG-Konformität, kein zentrales Backend, AVV.
2. „Wie unterscheidet sich Pruefai von ChatGPT, Microsoft Copilot oder fobizz?" → Lokaler Datenfluss, kein Account nötig, Schweizer Notenskala fest verdrahtet, Stiftpapier-First.
3. „Wer haftet, wenn die KI eine Note falsch vorschlägt?" → Klare Aussage: Lehrperson hat letzte Verantwortung, KI ist Assistent. Verweis auf AGB.
4. „Können wir Pruefai für eine ganze Fachschaft oder Schule lizenzieren?" → Sammel-Rabatt ab 5 Lizenzen, Kontakt-CTA.

**Aufwand:** 45 Min.

---

**Was:** Pricing-Karte „Pro" stärker hervorheben + Mengen-Anker.
**Warum:** Visuell ist Pro aktuell nur durch Border-Farbe markiert. Anker hilft Entscheidung.
**Wie:** In den Pricing-Karten unter `pricing-card__desc` jeweils eine Zeile ergänzen:

```html
<!-- Starter -->
<div class="pricing-card__desc">Für Lehrpersonen mit 1–2 Klassen<br><small style="color:var(--primary)">≈ 2 Klassen × 1 Prüfung/Monat</small></div>

<!-- Pro -->
<div class="pricing-card__desc">Für engagierte Lehrpersonen<br><small style="color:var(--primary)">≈ alle Ihre Klassen, das ganze Schuljahr</small></div>

<!-- Max -->
<div class="pricing-card__desc">Für Fachschaften, Stufenteams oder Schulen<br><small style="color:var(--primary)">≈ 5–10 Lehrpersonen geteilt</small></div>
```

Zusätzlich `.pricing-card--popular` visuell verstärken:

```css
.pricing-card--popular {
  border-color: var(--primary);
  box-shadow: 0 12px 40px rgba(26,86,219,.25);
  transform: scale(1.04);
}
@media (max-width: 640px) {
  .pricing-card--popular { transform: none; }
}
```

**Aufwand:** 30 Min.

---

**Was:** Jahres-Abo-Toggle (12× Monat für Preis von 10× Monat).
**Warum:** ~17 % Rabatt = standard. Wirkt auf Marge mit ~0.01 USD/Korrektur kaum, sichert dir aber Jahres-Cash und reduziert Churn um geschätzt 40–60 %.
**Wie:** Toggle über der Pricing-Grid, JS schaltet Preise und Stripe-Checkout-URL um (`?plan=pro_yearly`). Stripe braucht parallele Yearly-Price-IDs.

```html
<div style="display:flex;justify-content:center;align-items:center;gap:1rem;margin-bottom:2rem">
  <span id="lblMonthly" style="font-weight:600">Monatlich</span>
  <label style="position:relative;width:50px;height:28px">
    <input type="checkbox" id="billingToggle" onchange="toggleBilling()" style="opacity:0;width:0;height:0">
    <span style="position:absolute;cursor:pointer;inset:0;background:#ccc;border-radius:14px;transition:.2s"></span>
  </label>
  <span id="lblYearly">Jährlich <span style="background:#10b981;color:#fff;font-size:.7rem;padding:.15rem .5rem;border-radius:10px;margin-left:.25rem">−17 %</span></span>
</div>
```

**Aufwand:** Code 1 h, Stripe-Setup (3 neue Prices) 30 Min.

---

**Was:** Sticky-Mobile-CTA-Bar.
**Warum:** Auf Mobile scrollt jeder durch lange Seiten. Eine dauerhaft sichtbare „App testen"-Bar erhöht Click-Through um 15–30 %.
**Wie:**

```html
<div class="mobile-cta" style="display:none">
  <a href="./index.html">3 Prüfungen gratis testen →</a>
</div>
<style>
@media (max-width: 640px) {
  .mobile-cta { display:block;position:fixed;bottom:0;left:0;right:0;background:var(--primary);padding:.75rem;text-align:center;z-index:99;box-shadow:0 -4px 16px rgba(0,0,0,.15) }
  .mobile-cta a { color:#fff;font-weight:700;font-size:.95rem;text-decoration:none;display:block }
}
</style>
```

**Aufwand:** 20 Min.

---

## 2. SEO / Indexability

### Befund

- `landing.html`: `<title>` ist okay, `<meta description>` solide. Aber: **keine canonical-URL**, **kein OG-Image**, **kein JSON-LD**, **keine `robots`-Direktive** explizit.
- `index.html`: `<title>` ist nur „Pruefai" – das ist SEO-Selbstmord für die App-Route (`/`). Wenn `/` als App gerendert wird und `/landing` als Verkaufsseite – Google findet die App-Variante zuerst, indexiert „Pruefai" → Nutzer suchen „prüfungen korrigieren KI" und landen auf der nackten App ohne Verkaufsinhalt.
- **Sitemap fehlt**, **robots.txt fehlt** (du hast es per `ls` bestätigt).
- **URL-Struktur ist ein Problem**: `vercel.json` rewrited `/landing` → `landing.html`, aber `/` zeigt `index.html` (die App). Das heisst: Wer auf pruefai.ch landet, sieht die App, nicht die Verkaufsseite. **Das ist falsch herum.** App sollte unter `/app` liegen, Landing unter `/`.
- Bilder: aktuell nutzt die Landing nur Emojis als Icons → kein Alt-Text-Problem, aber auch kein OG-Image für Social-Shares.
- Manifest-Icon ist ein inline SVG-Data-URI mit Emoji → cleverer Hack, aber Google/Bing indexieren das schlecht für App-Store-Listings, falls du je in einen App-Index willst. Echtes 512×512 PNG erstellen.

### Long-Tail-Keywords (DACH-CH-Bildung)

Hier sind 12 (du wolltest mind. 8), priorisiert nach Suchintention + erreichbarer Konkurrenz:

1. **„prüfungen korrigieren mit KI schweiz"** – Money-Keyword, niedrige Konkurrenz.
2. **„KI korrekturhilfe lehrer schweiz"** – Käufer-Intent.
3. **„schweizer notensystem rechner online"** – Top-of-funnel, Traffic-Magnet.
4. **„prüfung scannen automatisch bewerten"** – Funktional, direkt unterer Funnel.
5. **„datenschutzkonforme KI für lehrer"** – nDSG-Schmerz.
6. **„fobizz alternative schweiz"** – Konkurrent-Vergleich, hochwertige Klicks.
7. **„chatgpt prüfungskorrektur datenschutz"** – adressiert reale Sorge.
8. **„zeugnisnoten berechnen tool"** – Top-of-funnel, leichter SEO-Win.
9. **„KI feedback schüleraufsatz"** – aufsatzlastige Lehrer (Deutsch, Geschichte).
10. **„prüfung handschrift erkennen software"** – OCR-Suchende.
11. **„berufsschule prüfung korrigieren KI"** – nischige Berufsschullehrer-Variante.
12. **„matura prüfung bewerten KI"** – Gymi-Variante.

### Konkrete Empfehlungen

**Was:** `<head>` der `landing.html` aufrüsten.
**Warum:** Aktuell fehlen canonical, OG-Image, Sprach-Hinweis, JSON-LD.
**Wie:** Diese Zeilen vor `</head>` einfügen (Zeile ~280):

```html
<link rel="canonical" href="https://pruefai.ch/" />
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
<meta property="og:locale" content="de_CH" />
<meta property="og:site_name" content="Pruefai" />
<meta property="og:image" content="https://pruefai.ch/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Pruefai – KI-gestützte Prüfungskorrektur für Schweizer Lehrpersonen" />
<meta name="twitter:image" content="https://pruefai.ch/og-image.png" />
<meta name="author" content="Thomas Walther" />
<meta name="geo.region" content="CH" />
<meta name="geo.placename" content="Schweiz" />

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Pruefai",
  "description": "KI-gestützte Prüfungskorrektur nach Schweizer Notenskala für Lehrpersonen aller Schultypen.",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web Browser (PWA)",
  "url": "https://pruefai.ch",
  "inLanguage": "de-CH",
  "offers": [
    { "@type": "Offer", "name": "Starter", "price": "9.00", "priceCurrency": "CHF", "category": "subscription" },
    { "@type": "Offer", "name": "Pro", "price": "19.00", "priceCurrency": "CHF", "category": "subscription" },
    { "@type": "Offer", "name": "Max", "price": "49.00", "priceCurrency": "CHF", "category": "subscription" }
  ],
  "creator": {
    "@type": "Person",
    "name": "Thomas Walther",
    "nationality": "CH"
  },
  "audience": {
    "@type": "EducationalAudience",
    "educationalRole": "teacher"
  }
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Sind die Prüfungsdaten meiner Schülerinnen und Schüler nDSG-konform geschützt?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ja. Pruefai speichert alle Daten lokal im Browser (IndexedDB). Prüfungstexte werden ausschliesslich zur Korrektur an die Claude AI übermittelt und nicht dauerhaft gespeichert."
      }
    }
    // weitere FAQ-Einträge spiegeln
  ]
}
</script>
```

**Aufwand:** 1 h (inkl. OG-Image-Erstellung in Figma/Canva 30 Min.).

---

**Was:** `robots.txt` und `sitemap.xml` anlegen.
**Wie:** Im Repo-Root je eine Datei:

```
# /robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /checkout-success
Disallow: /checkout-success.html

Sitemap: https://pruefai.ch/sitemap.xml
```

```xml
<!-- /sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://pruefai.ch/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://pruefai.ch/datenschutz</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://pruefai.ch/agb</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>
  <url><loc>https://pruefai.ch/avv</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>
</urlset>
```

Du musst die in `vercel.json` als Pass-Through konfigurieren – aktuell catch-all-rewritet `((?!api/).*)` auf `index.html`. Füge zwei explizite Rewrites davor ein:

```json
{ "source": "/robots.txt", "destination": "/robots.txt" },
{ "source": "/sitemap.xml", "destination": "/sitemap.xml" },
```

Oder besser: Dateien direkt im Repo-Root, dann werden sie statisch geliefert (Vercel hat das catch-all so konfiguriert, dass es greift – also explizite Pass-Through-Regel nötig).

**Aufwand:** 45 Min.

---

**Was:** URL-Struktur umstellen.
**Warum:** Wichtigster strategischer SEO-Move. Aktuell `/` → App, `/landing` → Verkaufsseite. Das muss umgekehrt sein.
**Wie:**

1. App-Route von `/` auf `/app` verschieben.
2. `/` zeigt `landing.html`.
3. Redirect `/landing` → `/` (301).

Im `vercel.json`:

```json
"rewrites": [
  { "source": "/", "destination": "/landing.html" },
  { "source": "/app", "destination": "/index.html" },
  { "source": "/app/:path*", "destination": "/index.html" },
  { "source": "/datenschutz", "destination": "/datenschutz.html" },
  { "source": "/agb", "destination": "/agb.html" },
  { "source": "/avv", "destination": "/avv.html" },
  { "source": "/checkout-success", "destination": "/checkout-success.html" },
  { "source": "/api/:path*", "destination": "/api/:path*" }
],
"redirects": [
  { "source": "/landing", "destination": "/", "permanent": true },
  { "source": "/landing.html", "destination": "/", "permanent": true }
]
```

**Achtung:** `manifest.json` hat `"start_url": "./index.html"` – nach Umstellung auf `./app/` oder `./index.html` bleibt für PWA-Installation OK, weil PWA über `/app` läuft. Manifest-Pfad ggf. anpassen.

**Aufwand:** 1.5 h inkl. Testing aller Links, weil sich App-interne Links ändern.

---

**Was:** `<title>` und `<meta description>` der App anpassen, damit Suchergebnisse für `/app` selbst etwas sagen.
**Wie:** In `index.html`:

```html
<title>Pruefai App – Prüfungen scannen & KI-korrigieren | Pruefai</title>
<meta name="description" content="Pruefai-App öffnen: handschriftliche Prüfungen scannen, Claude AI korrigiert nach Schweizer Notensystem. Alle Daten bleiben lokal im Browser." />
```

**Aufwand:** 5 Min.

---

## 3. Conversion-Funnel

### Befund: Free Trial

Aktuell: 3 Gratis-Korrekturen ohne Anmeldung in der App. **Das ist eigentlich gut**, wird aber auf der Landing **nicht klar kommuniziert**. Hero sagt „App testen" – als ob es ein Demo wäre. Es ist ein echtes 3-Korrekturen-Limit. Das gehört in die Headline.

### Befund: Onboarding nach Stripe-Kauf

Aktuell `checkout-success.html`:
- Lizenz wird angezeigt mit Copy-Button → gut.
- 4-Schritt-Anleitung „Einstellungen → Lizenz einfügen → Speichern" → manuell. **Reibung.**
- Fallback bei Webhook-Lag: „wird per E-Mail zugestellt" → aber wer schickt die E-Mail? Ist Resend/SendGrid eingerichtet? (siehe `api/`-Dateien checken.)

### Befund: Abbruch-Stellen

1. **Vor dem Klick auf „Plan wählen"**: Niemand weiss, was passiert. Klicke ich, lande ich direkt im Stripe-Checkout. Es gibt keine Zwischenseite „Sie kaufen den Pro-Plan – 19 CHF/Monat – nDSG-Hinweis – Stripe ist sicher".
2. **Nach Stripe-Checkout**: Nutzer landet auf `/checkout-success?session_id=...` und muss Lizenz selbst kopieren. Was passiert wenn er die Seite schliesst? Steht in der E-Mail die Lizenz? Wie wird sie zugestellt?
3. **Aktivierung in der App**: 4 Klicks (App → Einstellungen-Icon finden → Lizenz-Feld finden → Einfügen → Speichern). Das ist 2018er-Indie-Hacker-UX. **Muss weg.**

### Konkrete Empfehlungen

**Was:** Auto-Aktivierung der Lizenz via URL-Parameter.
**Warum:** Reduziert „4 manuelle Klicks" auf „0".
**Wie:** Nach Stripe-Webhook + erfolgreicher Lizenz-Erstellung leitet `checkout-success` automatisch nach 5 Sek. (oder via Button) zu `/app?activate=PRUEFAI-XXXX-XXXX` weiter. App liest beim Boot `?activate=` aus, ruft `/api/validate-license` auf, speichert in IndexedDB, zeigt Toast „✅ Pro-Plan aktiviert", entfernt URL-Parameter.

App-seitig Pseudocode (irgendwo im Init):

```js
const url = new URL(location.href);
const lic = url.searchParams.get('activate');
if (lic) {
  fetch('/api/validate-license', { method:'POST', body: JSON.stringify({ key: lic }) })
    .then(r => r.json())
    .then(d => {
      if (d.valid) {
        // store in IndexedDB
        showToast('✅ Lizenz aktiviert – Plan: ' + d.plan);
        url.searchParams.delete('activate');
        history.replaceState(null, '', url.toString());
      }
    });
}
```

In `checkout-success.html` Button-Text ändern: „App starten →" → `<a href="./index.html?activate=PRUEFAI-XXXX-XXXX">App starten & Lizenz aktivieren →</a>`.

**Aufwand:** 2–3 h.

---

**Was:** E-Mail-Quittung mit Lizenz + Onboarding-Tipps.
**Warum:** Stripe verschickt Standard-Quittung, aber ohne Lizenz und Anleitung. Du brauchst eine zweite E-Mail (Transaktion).
**Wie:** Im `stripe-webhook.js` nach Lizenz-Erstellung Resend-Mail (oder SendGrid) auslösen. Inhalt:
- Begrüssung
- Lizenz-Code als Plaintext (zum Copy-Paste falls Browser-Daten verloren)
- Direkt-Aktivierungs-Link `https://pruefai.ch/app?activate=KEY`
- 3 Tipps für die erste Korrektur
- Link zu Datenschutz & AVV-Download

**Aufwand:** 2 h (E-Mail-Template + Webhook-Integration).

---

**Was:** Geführter Erst-Korrektur-Flow in der App.
**Warum:** Erste echte Korrektur ist der „Aha-Moment". Wenn der Nutzer da scheitert, churnt er sofort. Aktuell weiss er nicht: Wo Prüfung erstellen? Wo Aufgaben definieren? Wo Schüler hinzufügen?
**Wie:** Beim allerersten App-Start (oder nach Lizenzeingabe) einen kurzen 4-Schritt-Wizard:
1. „Wie heisst Ihre Klasse?" (vorausgefüllt: 1a)
2. „Wie viele Aufgaben hat die Prüfung?" + max. Punktzahl pro Aufgabe
3. „Scannen Sie ein Prüfungsblatt" (Kamera/Upload)
4. Korrektur läuft, Ergebnis wird angezeigt – „Sieht das richtig aus?"

Das ist 1–2 Tage Arbeit. **Aber:** wenn keine Bandbreite, mach mindestens eine 60-Sek-Loom-Video-Anleitung und hänge sie auf checkout-success.html ein.

**Aufwand:** Voller Wizard 8–16 h. Minimum (Loom-Video + Embed): 2 h.

---

**Was:** Trial-Counter sichtbar in der App.
**Warum:** Wenn jemand 3 Gratis-Korrekturen hat, soll er sehen „2 von 3 verbraucht – upgrade jetzt für 9 CHF".
**Wie:** Sticky Badge in App-Header bei nicht-lizenzierten Nutzern. Bei Korrektur 3/3 Modal mit Upgrade-CTA. **Aufwand:** 1–2 h.

---

## 4. Pricing-Strategie

### Befund: Marge

Gegeben: Starter ~90 %, Pro ~80 %, Max ~70 %. Ehrliche Marge – das heisst aber auch: Du verdienst auf Starter pro Nutzer ~7 CHF/Monat. Bei 100 Starter-Kunden = 700 CHF/Monat. Das ist ein Hobby, kein Unternehmen.

**Strategische Folgerung:** Pro ist der Plan, an dem du verdienst. Max ist eigentlich ein verkappter Schul-/Team-Plan, der falsch verpackt ist. Schul-Lizenzen (5+ Lehrer) sollten separat sein.

### Befund: Pro als „Beliebt"

Ist visuell markiert, aber zu schwach (siehe Abschnitt 1). Mit der Skalierung + stärkerem Schatten wird er der klare Anker.

### Befund: Jahres-Discount

**Ja, einführen.** Bei einer Indie-Hacker-Solo-Operation ist Cashflow alles. 12 Monate × 10 CHF/Monat statt 12 × 9 ist nahezu zero-Risk. Vorschlag:

| Plan | Monatlich | Jährlich (Spar-Preis) | Effektiv/Monat | Rabatt |
|---|---|---|---|---|
| Starter | 9 CHF | 90 CHF | 7.50 CHF | −17 % |
| Pro | 19 CHF | 190 CHF | 15.83 CHF | −17 % |
| Max | 49 CHF | 490 CHF | 40.83 CHF | −17 % |

Schweizer Lehrer denken in Schuljahren. „Jahreslizenz" trifft den richtigen Frame.

### Befund: Schul-Lizenzen

Aktuell nirgendwo angeboten. Du hast `api/contact-enterprise.js` – also gibt es ein Lead-Capture, aber kein klarer „Schule/Fachschaft"-Eintrag in der Pricing-Tabelle.

**Empfehlung:** Eigene Karte „Schule" mit „ab CHF X / Lehrperson" oder „Auf Anfrage", verlinkt auf ein Formular. Konkretes Pricing-Beispiel (orientiert an Marktpreisen für DE/CH-EdTech):

- 5 Lehrpersonen-Lizenzen: 79 CHF/Monat (15.80/Person) – 17 % Rabatt auf Pro × 5
- 10 Lehrpersonen-Lizenzen: 149 CHF/Monat
- Schulweit (>10): individuell, Kontakt-CTA

**Was:** Schul-Plan als 4. Pricing-Karte ODER als eigene Section unter Pricing.
**Wie:** Vierte Karte oder Banner-Style:

```html
<section style="background:var(--primary-light);padding:2rem 1.5rem;border-radius:var(--radius);margin-top:2rem;text-align:center">
  <h3 style="font-size:1.25rem;font-weight:700;margin-bottom:.5rem">🏫 Für Schulen und Fachschaften</h3>
  <p style="color:var(--text-muted);max-width:520px;margin:0 auto 1.25rem">Mengenrabatt ab 5 Lizenzen · zentrale Rechnung · AVV inklusive · individuelles Onboarding für die Fachschaft.</p>
  <a href="mailto:info@pruefai.ch?subject=Schul-Lizenz%20Anfrage" class="btn-plan btn-plan--primary" style="display:inline-block;padding:.75rem 2rem;text-decoration:none">Schul-Lizenz anfragen</a>
</section>
```

**Aufwand:** 30 Min.

### Befund: Trial (3 Gratis-Korrekturen)

3 ist zu wenig. Eine Klassenprüfung = 15–25 Schüler. 3 Korrekturen heisst: Der Lehrer kann nicht eine ganze Klasse durchspielen, sieht also nicht den Mehrwert für seinen echten Alltag.

**Empfehlung:** Trial auf **10 Gratis-Korrekturen** erhöhen. KI-Kosten dafür: 10 × ~0.015 USD = 0.15 USD/Trial-User. Bei 1000 Trial-Usern = 150 USD = ~135 CHF. Vernachlässigbar gegenüber dem Conversion-Hebel.

Alternativ: **„Erste ganze Prüfung gratis – egal wie viele Schüler"** (Limit pro Prüfungsobjekt, nicht pro Korrektur). Das ist UX-mässig schöner, weil der Lehrer „eine echte Prüfung" durchspielen kann.

**Aufwand:** Code-Anpassung in App + API 2 h.

---

## 5. Promotion-Kanäle für CH-Lehrer

### Recherche-Ergebnisse

- **LCH (Dachverband Lehrerinnen und Lehrer Schweiz)** veröffentlicht **BILDUNG SCHWEIZ** (Auflage 42'000, monatlich, grösste Bildungspublikation der Schweiz). Sie haben einen LCH-Newsletter (2× pro Monat) und einen Verlag-Newsletter. Werbung im Heft ist über Redaktion buchbar.
- **Swissdidac Bern** ist DIE Bildungs-Fachmesse, alle 2 Jahre. Nächste: **November 2027**. Ca. 11'000 Besucher, 140 Aussteller, EdTech Collider mit Startup-Bereich. Lange Vorlaufzeit, aber für 2027 jetzt schon planen.
- **Swiss EdTech Collider** (EPFL/ZHAW) – Startup-Hub mit Testbed-Programm. Hier können Schulen neue Tools begleitet ausprobieren. **Sehr passend für Pruefai.** Aufnahme als Mitglied = Vertrauenssignal.
- **Pädagogische Hochschulen** (PHZH, PH Bern, PH Luzern, HEP Vaud, PH SG, PH FHNW etc.): EdTech-Partnerschaften existieren. Direkter Kontakt zu Digitalisierungs-Verantwortlichen / „Medienpädagogik"-Lehrstühlen.
- **Kantonale Bildungsdirektionen** – Lehrer-Tools werden teils kantonal empfohlen. Schwer aber wertvoll: Aufnahme in eine kantonale „Tool-Liste" = riesiger Trust-Boost.
- **Lehrerforen.de** hat eine Schweiz-Sektion – nicht riesig, aber community-relevant.

### Top 5 priorisierte Kanäle (Aufwand × Reichweite)

| # | Kanal | Aufwand | Reichweite/ROI | Wann |
|---|---|---|---|---|
| **1** | **Direkter Outreach (LinkedIn/E-Mail) an 100 Lehrpersonen + 30 Schulleitungen** | hoch (2 Wochen, 30+ h) | sehr hoch – das einzige, was sofort Kunden bringt, plus du lernst, was sie wirklich brauchen | **sofort** |
| **2** | **BILDUNG SCHWEIZ Inserat oder Advertorial** | mittel (Layout 4 h, Budget 2'000–5'000 CHF pro Insertion) | hoch – 42'000 Lehrer-Haushalte. Erst nach 5+ Testimonials sinnvoll. | nach Q1 |
| **3** | **Swiss EdTech Collider Mitgliedschaft + Testbed** | mittel (Bewerbung 8 h, Onboarding 1–2 Wochen) | mittel-hoch – Vertrauensanker, Beziehungen zu Schulen, Sichtbarkeit auf EdTech-Plattform | innerhalb 2 Mt. |
| **4** | **2–3 PH-Partnerschaften** (PHZH Medienpädagogik, PH Bern IDM, PH FHNW Digital Education) | mittel (Cold-Outreach 4 h, Pitch-Vorbereitung 4 h, Meeting 1–2 h pro PH) | hoch – Lehrer-Studis empfehlen Tools weiter, plus Forschungs-/Pilotchancen | innerhalb 3 Mt. |
| **5** | **Content-Marketing: 6 Artikel auf einem eigenen Blog `/blog`** zu Themen wie „Schweizer Notenskala genau erklärt", „nDSG für Lehrpersonen", „KI im Klassenzimmer – was darf ich?" | hoch (je Artikel 3–4 h Recherche + Schreiben) | mittel – SEO baut sich über 6–12 Monate auf | parallel laufend |

### Kanäle, die du **NICHT** machen sollst (jetzt)

- **Google Ads** – aktuell SmartScreen-Block + null sozialer Beweis = jeder Klick verbrannt.
- **Facebook/Instagram Ads** – Schweizer Lehrer sind dort kein gutes Akquise-Publikum, dafür bezahlst du blind.
- **Swissdidac 2027** – zu weit weg, aber **JETZT schon einen Spot reservieren** (Vorlauf 12+ Monate). Standkosten ~5'000–15'000 CHF, jedoch nur Sinn wenn du dann 50+ Kunden hast.
- **Print-Inserate in lokalen Zeitungen** – Streuverlust massiv.

### Konkrete Outreach-Vorlage (Quick Win)

**Was:** 100 personalisierte Mails an Sek-/Gym-Lehrer (LinkedIn-Suche „Lehrer Mathematik Schweiz", „Gymnasiallehrerin Deutsch", etc.).
**Warum:** Du brauchst 5–10 echte Testimonials VOR jeder anderen Marketing-Aktivität. Das ist der einzige Hebel, der das SmartScreen-Problem strukturell löst (Mund-zu-Mund > SmartScreen).
**Wie:**

```
Betreff: Pruefai – Pro-Plan gratis bis Sommerferien

Hallo Frau/Herr [Name],

ich habe Pruefai entwickelt – eine KI-Korrektur-App speziell für Schweizer
Lehrpersonen. Korrigieren nach Schweizer Notenskala, Daten bleiben lokal
im Browser (nDSG-konform, kein Cloud-Backend).

Ich suche aktuell 20 Lehrpersonen, die das Tool 6 Wochen unentgeltlich
nutzen und mir Feedback geben. Im Gegenzug erhalten Sie:

- Pro-Plan (300 Korrekturen/Monat) gratis bis Ende Schuljahr
- Direkter Draht zu mir für Wünsche/Anpassungen
- Wenn Sie zufrieden sind: ein 1–2-Satz-Testimonial für meine Webseite
  (mit Vor-/Nachname und Schule – oder auch anonym, ganz wie Sie wollen).

Wenn Interesse besteht, antworten Sie einfach kurz mit „Ja" – ich
schicke Ihnen einen Lizenzschlüssel.

Beste Grüsse aus [Stadt]
Thomas Walther
pruefai.ch
```

**Aufwand:** 100 Mails × 3 Min. = 5 h verteilt über 2 Wochen.

---

## 6. Quick Wins vs. Long-Term

### Top 10 Quick Wins (< 1 Tag)

| # | Was | Aufwand |
|---|---|---|
| 1 | Hero-Headline und CTAs umschreiben (siehe Abschnitt 1) | 30 Min |
| 2 | Trust-Strip unter Hero einfügen | 15 Min |
| 3 | `robots.txt`, `sitemap.xml` anlegen | 30 Min |
| 4 | JSON-LD `SoftwareApplication` + `FAQPage` in Landing | 1 h |
| 5 | OG-Image 1200×630 erstellen + verlinken | 30 Min |
| 6 | `/` und `/landing` URL-Struktur tauschen (vercel.json) | 1.5 h inkl. Testing |
| 7 | „DSGVO" überall durch „nDSG / Schweizer Datenschutzgesetz" ersetzen | 30 Min |
| 8 | Pricing-Karte: Pro stärker hervorheben + Mengen-Anker | 30 Min |
| 9 | Trial von 3 auf 10 Korrekturen erhöhen + Counter sichtbar machen | 2 h |
| 10 | Auto-Aktivierung via `?activate=`-URL-Parameter | 2.5 h |

**Gesamtaufwand Quick Wins:** ~10 Stunden, verteilbar auf 2 Tage.

### Top 5 Mid-Term-Projekte (1–2 Wochen)

| # | Was | Aufwand | Hebel |
|---|---|---|---|
| 1 | **Direkter Outreach-Sprint** (100 LinkedIn-Mails, 30 Schulleitungen) für 5–10 Testimonials | 30 h | sehr hoch – das einzige, was Anfangs-Traction bringt |
| 2 | **Jahres-Abos in Stripe** + Toggle auf Landing | 6 h | mittel – Cashflow, Churn-Reduktion |
| 3 | **Onboarding-Wizard** in App (4-Schritt-Tour bei erster Nutzung) | 8–16 h | hoch – Activation-Rate, weniger Churn |
| 4 | **Transaktions-E-Mail nach Kauf** (Resend/SendGrid) mit Lizenz + Anleitung | 4 h | mittel-hoch – Aktivierungs-Fallback |
| 5 | **Schul-Lizenz-Pricing-Karte** + Anfrage-Formular | 4 h | mittel – grössere Deals (50–500 CHF/Monat) |

### Top 3 Long-Term-Wetten (1–3 Monate)

| # | Was | Aufwand | Hebel |
|---|---|---|---|
| 1 | **PH-Partnerschaft mit 1–2 Hochschulen** (PHZH Medienpädagogik, PH FHNW) – Pilot mit Studierenden im Praktikum | 30–60 h verteilt | hoch – Distribution über Generationen, plus Glaubwürdigkeit |
| 2 | **Content-SEO-Aufbau**: `/blog` mit 6–10 Artikeln zu echten Lehrer-Pain-Themen (Schweizer Notenskala, Notenkonferenz vorbereiten, KI im Unterricht rechtlich, etc.) | 40–60 h | mittel-langsam – baut SEO-Defensive auf, dauert aber 6–12 Monate bis Wirkung |
| 3 | **Swiss EdTech Collider Mitgliedschaft + Testbed-Bewerbung** | 20 h Bewerbung + Onboarding | hoch – Trust-Signal, Beziehungen zu Schulen |

---

## 7. Tracking & KPIs (Plausible)

Du hast Plausible eingebunden (`landing.html` Zeile 640). Aktuell loggst du nur Pageviews. **Du musst Goals und Funnel-Steps definieren**, sonst weisst du nicht, wo Nutzer abbrechen.

### Goals (in Plausible einrichten)

| Event-Name | Wo getriggert | Was es misst |
|---|---|---|
| `Landing View` | Landing-Pageview | Top-of-Funnel |
| `App Test Click` | Klick auf „App testen" / „3 Prüfungen gratis" | Trial-Intent |
| `Pricing View` | Scroll oder Klick auf `#preise` | Mid-Funnel Interesse |
| `Plan Click - Starter/Pro/Max` | Klick auf Pricing-CTA | Plan-Präferenz |
| `Stripe Checkout Start` | Redirect zu Stripe | Kauf-Intent |
| `Checkout Success` | Pageview `/checkout-success` | Conversion |
| `License Activated` | App-seitig bei erfolgreicher Aktivierung | Aktivierung |
| `First Correction` | App-seitig bei erster Korrektur | Aha-Moment |
| `Trial Limit Hit` | App-seitig bei 3/3 Trial verbraucht | Upgrade-Trigger |
| `Contact Enterprise` | Submit auf `api/contact-enterprise` | Schul-Lead |

Code-Snippet für Custom-Events:

```js
// auf Landing in Click-Handler des Plan-CTA:
plausible('Plan Click', { props: { plan: 'pro' } });

// in App nach License-Validate:
plausible('License Activated', { props: { plan: 'pro' } });
```

### Funnel-Schritte zum Tracken

```
Landing View (100 %)
  ↓
App Test Click ODER Pricing View
  ↓
Plan Click (Starter|Pro|Max)
  ↓
Stripe Checkout Start
  ↓
Checkout Success
  ↓
License Activated
  ↓
First Correction (Aha-Moment, Activation)
  ↓
Active in Week 2 (Retention)
```

Setze als Benchmark zum Vergleichen:

| Schritt | Erwartete Conversion (B2B-SaaS-Median) | Pruefai-Ziel |
|---|---|---|
| Landing → Trial-Click | 8–15 % | >12 % |
| Landing → Pricing-View | 25–35 % | >30 % |
| Pricing → Plan-Click | 10–20 % | >15 % |
| Plan-Click → Stripe Start | 60–80 % | >70 % |
| Stripe Start → Success | 60–80 % | >70 % |
| Checkout → First Correction | 50–70 % | >60 % |

Bei 1000 Landing-Views erwartest du also ~10–18 First-Correction-Events. Das sind deine Pro/Starter-Kunden mit echtem Aktivierungs-Erlebnis.

### Wöchentliches Review (15 Min)

- Plausible-Dashboard: Top-Quellen, Funnel-Conversion, Trial-Limit-Hit-Rate.
- Stripe-Dashboard: MRR, neue Kunden, Churn, gescheiterte Zahlungen.
- IndexedDB-Telemetrie kannst du nicht messen (ist clientseitig) – wenn du wissen willst, wie oft Leute echt Korrekturen machen, brauchst du ein opt-in Plausible-Event in der App (anonym, kein PII).

### Bounce-Rate

Plausible misst standardmässig „Bounces" = einzelne Pageview-Sessions ohne weiteren Klick. **Ziel: < 50 %** auf der Landing. Wenn höher: Hero ist falsch / Pagespeed-Problem / Trust-Signal fehlt.

---

## Schluss-Notiz: Ehrlicher Reality-Check

Pruefai ist technisch solide (PWA, lokale Daten, AVV, vernünftiges Pricing, gute KI-Wahl mit Claude Haiku 4.5). **Das Problem ist nicht das Produkt – das Problem ist die Distribution.** Schweizer Lehrer kaufen Software über drei Kanäle: (1) Empfehlung von Kolleg:innen, (2) PH-Dozent:in zeigt es im Studium, (3) Schulleitung sagt „nutzt das". SmartScreen-Re-Klassifizierung wird ein, zwei Wochen helfen, ist aber kein strategischer Hebel.

Wenn du diesen Plan abarbeitest, ist die Reihenfolge wichtig:

1. **Quick Wins (Woche 1):** Landing reparieren, SEO-Basics, URL-Struktur.
2. **Testimonials beschaffen (Woche 2–4):** Outreach-Sprint, mind. 5 echte Lehrer-Zitate.
3. **Onboarding glattziehen (Woche 3–4):** Auto-Aktivierung, Wizard, E-Mail.
4. **Erst dann (ab Monat 2):** Bezahlte Kanäle (BILDUNG SCHWEIZ Inserat), PH-Partnerschaften, Content-Aufbau.

Mache nicht Schritt 4 vor Schritt 2 – das ist der häufigste Indie-Hacker-Fehler. Ohne sozialen Beweis brennt jede Werbe-Franke.

Viel Erfolg.
