// Leonida Platinum Atlas — local preview server (Round 7, written fresh).
// Serves app/ at / and screenshots/ at /screenshots, static files only.
// Run: node serve.ts [port]  (default 8080). Then open http://localhost:8080/
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.argv[2] || process.env.PORT || 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const rel = normalize(clean).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]/, '');
  if (rel === '') return join(ROOT, 'app', 'index.html');
  if (rel.startsWith('screenshots/')) return join(ROOT, rel);
  return join(ROOT, 'app', rel);
}

const server = createServer((req, res) => {
  try {
    const file = safePath(req.url || '/');
    if (!existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(readFileSync(file));
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('server error: ' + err.message);
  }
});

server.listen(PORT, () => console.log('Leonida Platinum Atlas at http://localhost:' + PORT + '/'));
