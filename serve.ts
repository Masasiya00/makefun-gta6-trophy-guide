// serve.ts — a small static server for local development only.
//
// Serves this repository's app/ folder on http://localhost:8080
// (`node serve.ts --port 9000` for another port) so the guide can be
// tried in desktop Chrome exactly as a static host would serve it.
// Node 22, standard library only; it reads files from disk, sends the
// MIME type a browser needs, and refuses any path that escapes app/.
// It is a dev convenience, not a server for the internet.

import { readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(fileURLToPath(new URL("./app", import.meta.url)));

const args = process.argv.slice(2);
const portFlag = args.indexOf("--port");
const wanted = portFlag === -1 ? 8080 : Number(args[portFlag + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

/** Resolve a request path to a file inside app/, or null when forbidden. */
function resolveInsideApp(requestPath: string): string | null {
  const decoded = decodeURIComponent(requestPath);
  const withIndex = decoded.endsWith("/") ? decoded + "index.html" : decoded;
  const file = resolve(join(appRoot, normalize(withIndex)));
  if (file !== appRoot && !file.startsWith(appRoot + sep)) return null;
  return file;
}

createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  // Browsers ask for /favicon.ico on their own; there is no icon file in
  // this guide, so answer "no content" instead of a 404 that would show
  // up as a console error on every load.
  if (url.pathname === "/favicon.ico") {
    response.writeHead(204).end();
    return;
  }
  let file: string | null = null;
  try {
    file = resolveInsideApp(url.pathname);
  } catch {
    response.writeHead(400).end("bad request");
    return;
  }
  if (file === null) {
    response.writeHead(403).end("forbidden");
    return;
  }
  let body: Buffer;
  try {
    if (!statSync(file).isFile()) throw new Error("not a file");
    body = readFileSync(file);
  } catch {
    response.writeHead(404).end("not found");
    return;
  }
  response.writeHead(200, {
    "content-type": MIME_TYPES[extname(file).toLowerCase()] ?? "application/octet-stream",
    "content-length": body.length,
    "cache-control": "no-store",
  });
  response.end(body);
}).listen(port, "127.0.0.1", () => {
  console.log(`LEONIDA PLATINUM ATLAS is on http://localhost:${port}`);
  console.log(`Serving ${appRoot} (offline — no network requests are made)`);
});
