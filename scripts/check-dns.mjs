#!/usr/bin/env node
/**
 * DNS-Verifikation für pruefai.ch.
 *
 * Probt alle in docs/domain-setup.md geforderten Records via DNS und
 * druckt eine Checkliste. Exit-Code 0 nur wenn alle Pflicht-Records
 * gefunden wurden.
 *
 * Optionaler Domain-Override: APP_DOMAIN=test.example.com node scripts/check-dns.mjs
 */

import dns from 'node:dns/promises';

const DOMAIN = (process.env.APP_DOMAIN || 'pruefai.ch').replace(/^\.|\.$/g, '');

const C = {
  ok: '\x1b[32m✓\x1b[0m',
  miss: '\x1b[31m✗\x1b[0m',
  warn: '\x1b[33m⚠\x1b[0m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const checks = [
  {
    id: 'apex-a',
    label: 'Apex A-Record → Vercel',
    required: true,
    async run() {
      const ips = await dns.resolve(DOMAIN, 'A');
      const vercelIps = ['216.198.79.1', '76.76.21.21'];
      const onVercel = ips.some((ip) => vercelIps.includes(ip));
      return {
        ok: onVercel,
        info: ips.join(', ') + (onVercel ? '' : ' (kein Vercel-IP)'),
      };
    },
    fix: 'Cyon DNS-Editor → A-Record für Apex auf 216.198.79.1 setzen.',
  },
  {
    id: 'www-cname',
    label: 'www CNAME → Vercel',
    required: true,
    async run() {
      const c = await dns.resolveCname(`www.${DOMAIN}`);
      const target = c[0] || '';
      const isVercel = /vercel/i.test(target);
      return { ok: isVercel, info: target };
    },
    fix: 'Cyon DNS-Editor → CNAME für www auf cname.vercel-dns.com. setzen.',
  },
  {
    id: 'caa',
    label: 'CAA für Let\'s Encrypt',
    required: true,
    async run() {
      const records = await dns.resolveCaa(DOMAIN);
      const le = records.find((r) => r.issue && /letsencrypt\.org/i.test(r.issue));
      return {
        ok: !!le,
        info: records.length ? records.map((r) => JSON.stringify(r)).join('; ') : '(keine CAA-Records)',
      };
    },
    fix: 'docs/domain-setup.md §1 – Cyon: CAA-Record `0 issue "letsencrypt.org"` am Apex anlegen.',
  },
  {
    id: 'send-mx',
    label: 'Resend: send.<domain> MX',
    required: true,
    async run() {
      const mx = await dns.resolveMx(`send.${DOMAIN}`);
      const onSes = mx.some((m) => /amazonses\.com$/i.test(m.exchange) || /resend/i.test(m.exchange));
      return {
        ok: onSes,
        info: mx.map((m) => `${m.priority} ${m.exchange}`).join('; '),
      };
    },
    fix: 'docs/domain-setup.md §2 – Resend → Add Domain → MX-Eintrag für send.<domain> wie angezeigt setzen.',
  },
  {
    id: 'send-spf',
    label: 'Resend: send.<domain> SPF',
    required: true,
    async run() {
      const txts = await dns.resolveTxt(`send.${DOMAIN}`);
      const flat = txts.map((t) => t.join(''));
      const spf = flat.find((t) => /^v=spf1\b/.test(t));
      return {
        ok: !!spf && /amazonses\.com/i.test(spf),
        info: spf || flat.join(' | ') || '(keine TXT)',
      };
    },
    fix: 'docs/domain-setup.md §2 – Resend → SPF-Eintrag `v=spf1 include:amazonses.com ~all` auf send.<domain>.',
  },
  {
    id: 'resend-dkim',
    label: 'Resend: resend._domainkey DKIM',
    required: true,
    async run() {
      const txts = await dns.resolveTxt(`resend._domainkey.${DOMAIN}`);
      const flat = txts.map((t) => t.join(''));
      const dkim = flat.find((t) => /\bp=/.test(t));
      return {
        ok: !!dkim,
        info: dkim ? dkim.slice(0, 60) + '…' : flat.join(' | ') || '(keine TXT)',
      };
    },
    fix: 'docs/domain-setup.md §2 – Resend Dashboard zeigt den DKIM-Wert; als TXT auf resend._domainkey.<domain> eintragen.',
  },
  {
    id: 'dmarc',
    label: 'DMARC-Policy',
    required: true,
    async run() {
      const txts = await dns.resolveTxt(`_dmarc.${DOMAIN}`);
      const flat = txts.map((t) => t.join(''));
      const dmarc = flat.find((t) => /^v=DMARC1\b/i.test(t));
      if (!dmarc) return { ok: false, info: '(kein DMARC-Record)' };
      const m = dmarc.match(/\bp=(none|quarantine|reject)\b/i);
      const policy = m ? m[1].toLowerCase() : '?';
      const ok = policy !== '?';
      const note = policy === 'none' ? ' (Start-Policy – nach 2 Wochen auf quarantine ziehen)' : '';
      return { ok, info: `p=${policy}${note}` };
    },
    fix: 'docs/domain-setup.md §3 – TXT auf _dmarc.<domain> mit `v=DMARC1; p=none; rua=mailto:dmarc-reports@<domain>` setzen.',
  },
  {
    id: 'apex-spf',
    label: 'Apex-SPF (optional, empfohlen)',
    required: false,
    async run() {
      const txts = await dns.resolveTxt(DOMAIN);
      const flat = txts.map((t) => t.join(''));
      const spf = flat.find((t) => /^v=spf1\b/.test(t));
      return { ok: !!spf, info: spf || '(kein Apex-SPF)' };
    },
    fix: 'docs/domain-setup.md §4 – TXT am Apex mit `v=spf1 -all` (Default-Reject) oder Provider-Include setzen.',
  },
];

console.log(`\n${C.bold}DNS-Check für ${DOMAIN}${C.reset}\n`);

let failed = 0;
let warned = 0;

for (const c of checks) {
  let result;
  try {
    result = await c.run();
  } catch (err) {
    result = { ok: false, info: `lookup error: ${err.code || err.message}` };
  }
  const icon = result.ok ? C.ok : c.required ? C.miss : C.warn;
  console.log(`  ${icon} ${c.label.padEnd(40)} ${C.dim}${result.info}${C.reset}`);
  if (!result.ok) {
    console.log(`    ${C.dim}→ ${c.fix}${C.reset}`);
    if (c.required) failed++;
    else warned++;
  }
}

console.log('');
if (failed === 0 && warned === 0) {
  console.log(`${C.ok} ${C.bold}Alle DNS-Records gesetzt. Domain ist sauber konfiguriert.${C.reset}\n`);
  process.exit(0);
} else {
  console.log(`${C.bold}${failed}${C.reset} Pflicht-Records fehlen, ${C.bold}${warned}${C.reset} optionale Records fehlen.`);
  console.log(`Setup-Anleitung: ${C.bold}docs/domain-setup.md${C.reset}\n`);
  process.exit(failed > 0 ? 1 : 0);
}
