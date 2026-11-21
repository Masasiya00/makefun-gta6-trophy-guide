// serve.ts — serve app/ on http://localhost:8080 for local playtesting.
// Node 22, standard library only. Run: node serve.ts
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const APP_DIR = resolve(import.meta.dirname ?? ".", "app");
const PORT = 8080;

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = createServer((req, res) => {
  const rawPath = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  const safePath = normalize(join(APP_DIR, rawPath === "/" ? "index.html" : rawPath));
  if (!safePath.startsWith(APP_DIR) || !existsSync(safePath) || !statSync(safePath).isFile()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not found\n");
    return;
  }
  const type = MIME[extname(safePath).toLowerCase()] ?? "application/octet-stream";
  res.writeHead(200, { "content-type": type });
  res.end(readFileSync(safePath));
});

server.listen(PORT, () => {
  console.log(`LEONIDA PLATINUM ATLAS served at http://localhost:${PORT}/`);
});
