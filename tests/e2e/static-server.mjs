// Minimaler Vercel-Routing-Emulator für die Playwright-Smoke-Tests.
//
// Bildet die Routing-Reihenfolge von Vercel nach: redirects → Dateisystem → rewrites.
// Genau diese Reihenfolge ("existierende Dateien gewinnen vor rewrites") hat das
// Routing in PR #45 / #50 zweimal gebrochen – deshalb wird sie hier echt durchgespielt
// und nicht durch einen simplen statischen Server ersetzt.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url)).replace(/[\\/]+$/, '');
const PORT = Number(process.env.PORT) || 4321;

const config = JSON.parse(await readFile(join(ROOT, 'vercel.json'), 'utf8'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

// Wandelt ein Vercel-Route-`source` in einen RegExp um.
function sourceToRegExp(source) {
  if (source.includes('(')) return new RegExp(`^${source}$`);
  if (source.includes(':')) {
    return new RegExp(
      '^' +
        source.replace(/:[A-Za-z]+\*/g, '(.*)').replace(/:[A-Za-z]+/g, '([^/]+)') +
        '$',
    );
  }
  return new RegExp(`^${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

const redirects = (config.redirects || []).map((r) => ({ ...r, re: sourceToRegExp(r.source) }));
const rewrites = (config.rewrites || []).map((r) => ({ ...r, re: sourceToRegExp(r.source) }));

function hasMatch(has, url) {
  if (!has) return true;
  return has.every((cond) => cond.type === 'query' && url.searchParams.has(cond.key));
}

// Löst einen Pfad gegen das Dateisystem auf (inkl. directory-index, wie Vercel).
async function resolveFile(pathname) {
  const rel = decodeURIComponent(pathname);
  const abs = normalize(join(ROOT, rel));
  if (abs !== ROOT && !abs.startsWith(ROOT + sep)) return null; // Path-Traversal-Schutz
  try {
    const s = await stat(abs);
    if (s.isDirectory()) {
      const index = join(abs, 'index.html');
      await stat(index);
      return index;
    }
    return abs;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const { pathname } = url;

  // 1. Redirects
  for (const r of redirects) {
    if (r.re.test(pathname) && hasMatch(r.has, url)) {
      res.writeHead(r.permanent ? 308 : 307, { Location: r.destination });
      res.end();
      return;
    }
  }

  // 2. Dateisystem – existierende Dateien gewinnen vor rewrites
  let file = await resolveFile(pathname);

  // 3. Rewrites
  if (!file) {
    for (const r of rewrites) {
      if (r.re.test(pathname)) {
        if (!r.destination.startsWith('/api/')) {
          file = await resolveFile(r.destination);
        }
        break;
      }
    }
  }

  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  const body = await readFile(file);
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
  res.end(body);
});

server.listen(PORT, () => {
  console.log(`static-server (Vercel-Emulator) läuft auf http://localhost:${PORT}`);
});
