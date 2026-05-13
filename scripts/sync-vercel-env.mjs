#!/usr/bin/env node
/**
 * Upserts Vercel environment variables via the Vercel REST API.
 *
 * Reads variable values from process.env (the workflow passes them as
 * step-outputs from setup-stripe.mjs). Skips empty values or the marker
 * "<unchanged>" so a re-run of setup-stripe.mjs that didn't issue a new
 * webhook secret leaves the existing one alone.
 *
 * Required env:
 *   VERCEL_TOKEN           Personal/team token with project write scope
 *   VERCEL_PROJECT_ID
 *
 * Optional env:
 *   VERCEL_TEAM_ID         (= VERCEL_ORG_ID from project settings; needed for team-scoped projects)
 *   VERCEL_TARGETS         Comma-separated subset of: production,preview,development
 *                          Default: production,preview,development (matches Vercel's "All Environments")
 *
 * Variables synced (only those with a non-empty, non-"<unchanged>" value):
 *   STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, STRIPE_PRICE_MAX  (type: encrypted)
 *   STRIPE_WEBHOOK_SECRET                                     (type: sensitive)
 */

const API = 'https://api.vercel.com';
const token = process.env.VERCEL_TOKEN;
const projectId = process.env.VERCEL_PROJECT_ID;
const teamId = process.env.VERCEL_TEAM_ID || '';
const targets = (process.env.VERCEL_TARGETS || 'production,preview,development')
  .split(',').map((t) => t.trim()).filter(Boolean);

if (!token || !projectId) {
  console.error('ERROR: VERCEL_TOKEN and VERCEL_PROJECT_ID are required.');
  process.exit(1);
}

function isSet(v) {
  return typeof v === 'string' && v.length > 0 && v !== '<unchanged>';
}

const pairs = [
  ['STRIPE_PRICE_STARTER',  process.env.STRIPE_PRICE_STARTER,  'encrypted'],
  ['STRIPE_PRICE_PRO',      process.env.STRIPE_PRICE_PRO,      'encrypted'],
  ['STRIPE_PRICE_MAX',      process.env.STRIPE_PRICE_MAX,      'encrypted'],
  ['STRIPE_WEBHOOK_SECRET', process.env.STRIPE_WEBHOOK_SECRET, 'sensitive'],
].filter(([, v]) => isSet(v));

if (pairs.length === 0) {
  console.log('No env vars to sync (setup-stripe.mjs produced no fresh values).');
  process.exit(0);
}

function withTeam(path) {
  if (!teamId) return path;
  return path + (path.includes('?') ? '&' : '?') + 'teamId=' + encodeURIComponent(teamId);
}

async function api(path, init = {}) {
  const res = await fetch(API + withTeam(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const msg = (typeof data === 'object' && data && data.error && data.error.message) || text;
    throw new Error(`Vercel API ${res.status} on ${init.method || 'GET'} ${path}: ${msg}`);
  }
  return data;
}

console.log(`Syncing ${pairs.length} env vars to Vercel`);
console.log(`  project: ${projectId}`);
console.log(`  team:    ${teamId || '(personal account)'}`);
console.log(`  targets: ${targets.join(', ')}\n`);

const existing = await api(`/v9/projects/${projectId}/env?decrypt=false`);
const byKey = new Map();
for (const e of existing.envs || []) byKey.set(e.key, e);

for (const [key, value, type] of pairs) {
  const found = byKey.get(key);
  try {
    if (found) {
      await api(`/v9/projects/${projectId}/env/${found.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ value, target: targets, type }),
      });
      console.log(`  = ${key.padEnd(24)} updated`);
    } else {
      await api(`/v10/projects/${projectId}/env`, {
        method: 'POST',
        body: JSON.stringify({ key, value, target: targets, type }),
      });
      console.log(`  + ${key.padEnd(24)} created`);
    }
  } catch (err) {
    console.error(`  ✗ ${key}: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\nDone. A redeploy is required for Vercel to pick up new values.');
