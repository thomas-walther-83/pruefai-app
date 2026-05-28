# DPA-Status: Sub-Auftragsbearbeiter

Stand: 2026-05-28 · interner Check für Thomas Walther

## Zweck

Dokumentiert pro Sub-Auftragsbearbeiter, ob ein Auftragsverarbeitungs­vertrag (Data Processing Agreement / DPA) besteht und – falls nicht – welche Schritte zum Abschluss nötig sind. Diese Liste sollte vor der ersten Aussage gegenüber Kunden oder Behörden ("wir haben DPAs mit allen Sub-Bearbeitern") vollständig abgearbeitet sein.

## Übersicht

| Anbieter | DPA-Status | Wie kommt der DPA zustande? | Aufwand |
|---|---|---|---|
| **Anthropic PBC** | ✅ automatisch | Beim Akzeptieren der [Commercial Terms](https://www.anthropic.com/legal/commercial-terms) im API-Console wird die [DPA](https://privacy.claude.com/en/articles/7996862-how-do-i-view-and-sign-your-data-processing-addendum-dpa) als Bestandteil mit einbezogen. Für Enterprise-Tier zusätzliche Bestätigung via Account Manager möglich. | bestehend |
| **Stripe Payments Europe Ltd.** | ✅ automatisch | Stripes [DPA](https://stripe.com/dpa) ist Teil der Service-Vereinbarung und gilt für alle Konten automatisch. Keine separate Unterschrift nötig. | bestehend |
| **Vercel Inc.** | ⚠️ zu prüfen | Pro-Plan: DPA über Account Settings → Legal → Data Processing Addendum „request signed copy". Hobby-Plan: per E-Mail privacy@vercel.com anfragen. Mit aktivem Pro-Plan ist Verzeichnis-Klick ausreichend. | ~5 min |
| **Upstash Inc.** | ⚠️ zu prüfen | DPA-PDF über Console → Settings → Legal & Compliance → „Request DPA". Wird per E-Mail gegengezeichnet. | ~10 min |
| **Resend (Drogon, Inc.)** | ⚠️ zu prüfen | [Resend DPA](https://resend.com/legal/dpa) – per E-Mail compliance@resend.com gegenzeichnen lassen oder im Dashboard unter Settings → Legal anfragen. | ~10 min |

## Konkrete nächste Schritte (in Reihenfolge)

1. **Vercel**: einloggen → Account Settings → Legal → DPA herunterladen, Bestätigung als PDF im Ordner `dpa-archive/` ablegen.
2. **Upstash**: Console → Settings → Compliance → DPA anfragen. PDF nach Erhalt im Archiv ablegen.
3. **Resend**: E-Mail an `compliance@resend.com` mit „Bitte DPA für Konto X gegenzeichnen". PDF archivieren.
4. **Anthropic**: bestehender Commercial-Terms-Abschluss reicht; falls Audit-Anfrage kommt, Anthropic Privacy Center-Eintrag als Beleg verlinken.
5. **Stripe**: keine Aktion nötig; Hinweis auf `stripe.com/dpa` in Antwort ausreichend.

## Lokales Archiv

Alle erhaltenen DPA-PDFs werden im privaten Cloud-Ordner `Geschäft/PruefAI/Compliance/DPAs/` abgelegt, mit Dateinamen `<Anbieter>-DPA-<JJJJ-MM-TT>.pdf`. Bei Audit-Anfragen sind sie auf Verlangen vorlegbar.

## Re-Check

Diese Checkliste mindestens **alle 12 Monate** prüfen oder bei jedem Wechsel eines Sub-Auftragsbearbeiters. Letzte Prüfung: 2026-05-28.

## Verwandte Dokumente

- [`subprocessors.md`](./subprocessors.md) – öffentliche Sub-Auftragsbearbeiter-Übersicht
- [`bearbeitungsverzeichnis.md`](./bearbeitungsverzeichnis.md)
- [`/subprocessors`](https://pruefai.ch/subprocessors) – öffentliche Variante
