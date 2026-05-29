# DPA-Status: Sub-Auftragsbearbeiter

Stand: 2026-05-28 · interner Check für Thomas Walther

## Zweck

Dokumentiert pro Sub-Auftragsbearbeiter, ob ein Auftragsverarbeitungs­vertrag (Data Processing Agreement / DPA) besteht und – falls nicht – welche Schritte zum Abschluss nötig sind. Diese Liste sollte vor der ersten Aussage gegenüber Kunden oder Behörden ("wir haben DPAs mit allen Sub-Bearbeitern") vollständig abgearbeitet sein.

## Übersicht

| Anbieter | DPA-Status | Wie kommt der DPA zustande? | Aufwand |
|---|---|---|---|
| **Anthropic PBC** | ✅ automatisch | Beim Akzeptieren der [Commercial Terms](https://www.anthropic.com/legal/commercial-terms) im API-Console wird die [DPA](https://privacy.claude.com/en/articles/7996862-how-do-i-view-and-sign-your-data-processing-addendum-dpa) als Bestandteil mit einbezogen. Für Enterprise-Tier zusätzliche Bestätigung via Account Manager möglich. | bestehend |
| **Stripe Payments Europe Ltd.** | ✅ automatisch | Stripes [DPA](https://stripe.com/dpa) ist Teil der Service-Vereinbarung und gilt für alle Konten automatisch. Keine separate Unterschrift nötig. | bestehend |
| **Vercel Inc.** | 🟡 Hobby-Plan: kein gegengezeichneter DPA | Vercel-Antwort vom 2026-05-29: „The Vercel Data Processing Addendum applies to the processing of personal data for customers who are on Pro or Enterprise plans. It does not apply to projects or accounts on the free Hobby plan." → Status: PruefAI nutzt die [öffentliche Vercel-DPA](https://vercel.com/legal/dpa) und das [Vercel Trust Center](https://vercel.com/security) als Referenz. Standard Terms + Privacy Policy + EU-Standardvertragsklauseln gelten weiterhin. Beim Wechsel auf Pro/Enterprise wird der gegengezeichnete DPA nachgeholt. | dokumentiert |
| **Upstash Inc.** | ✅ unterzeichnet | Standard-DPA (8 Seiten) erhalten am 2026-05-29; verweist auf <https://trust.upstash.com/subprocessors> und die Security-Measures-Anhänge. Archiv-Datei: `Upstash-DPA-2026-05-29.pdf`. | erledigt |
| **Resend (Drogon, Inc.)** | ⚠️ zu prüfen | [Resend DPA](https://resend.com/legal/dpa) – per E-Mail compliance@resend.com gegenzeichnen lassen oder im Dashboard unter Settings → Legal anfragen. | ~10 min |

## Konkrete nächste Schritte (in Reihenfolge)

1. **Vercel**: Hobby-Plan abgehakt. Vercel-Antwort und die öffentlichen Dokumente unter <https://vercel.com/legal/dpa> bzw. <https://vercel.com/security> als PDF im Compliance-Archiv ablegen. Beim späteren Upgrade auf Pro/Enterprise den gegengezeichneten DPA nachholen.
2. **Upstash**: ✅ erhalten am 2026-05-29 (`Upstash-DPA-2026-05-29.pdf`). Im Compliance-Archiv abgelegt.
3. **Resend**: E-Mail an `compliance@resend.com` mit „Bitte DPA für Konto X gegenzeichnen". PDF archivieren.
4. **Anthropic**: bestehender Commercial-Terms-Abschluss reicht; falls Audit-Anfrage kommt, Anthropic Privacy Center-Eintrag als Beleg verlinken.
5. **Stripe**: keine Aktion nötig; Hinweis auf `stripe.com/dpa` in Antwort ausreichend.

## Spezialfall Vercel Hobby-Plan

Vercel bietet einen formalen, gegengezeichneten DPA nur für **Pro- und Enterprise-Pläne** an. Auf dem **Hobby-Plan** gilt die [öffentliche Vercel-DPA](https://vercel.com/legal/dpa) als Standard-Vertragsgrundlage, ergänzt durch Privacy Policy und EU-Standardvertragsklauseln (SCCs).

Risikoabschätzung für PruefAI: Vercel verarbeitet bei uns nur folgende Daten:
- IP-Adressen in Serverless-Function-Logs (≤ 30 Tage)
- HTTP-Request-Metadaten (Method, Path, Status)
- **Keine** persistenten Schülerdaten, keine Zahlungsdaten

Die Restrisiko-Differenz zwischen „gegengezeichnetem DPA" und „öffentlicher DPA + SCCs" ist bei diesem Datenvolumen vernachlässigbar. Bei einem späteren Wechsel auf Pro/Enterprise wird der gegengezeichnete DPA nachgeholt und diese Checkliste aktualisiert.

## Lokales Archiv

Alle erhaltenen DPA-PDFs werden im privaten Cloud-Ordner `Geschäft/PruefAI/Compliance/DPAs/` abgelegt, mit Dateinamen `<Anbieter>-DPA-<JJJJ-MM-TT>.pdf`. Bei Audit-Anfragen sind sie auf Verlangen vorlegbar.

## Re-Check

Diese Checkliste mindestens **alle 12 Monate** prüfen oder bei jedem Wechsel eines Sub-Auftragsbearbeiters. Letzte Prüfung: 2026-05-28.

## Verwandte Dokumente

- [`subprocessors.md`](./subprocessors.md) – öffentliche Sub-Auftragsbearbeiter-Übersicht
- [`bearbeitungsverzeichnis.md`](./bearbeitungsverzeichnis.md)
- [`/subprocessors`](https://pruefai.ch/subprocessors) – öffentliche Variante
