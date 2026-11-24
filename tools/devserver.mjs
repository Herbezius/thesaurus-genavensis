// Serveur local de test : sert public/ et route /api/* vers la fonction, avec un stockage en mémoire.
process.env.TG_MEMORY_STORE = "1";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
const api = (await import("../netlify/functions/api.mjs")).default;
const root = new URL("../public/", import.meta.url).pathname;
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".mp4": "video/mp4" };
http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const r = await api(new Request(url, { method: req.method, headers: req.headers, body: req.method === "POST" ? Buffer.concat(chunks) : undefined }));
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(await r.text()); return;
  }
  const p = join(root, url.pathname === "/" ? "index.html" : url.pathname);
  try { const b = await readFile(p); res.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }); res.end(req.method === "HEAD" ? undefined : b) }
  catch { res.writeHead(404); res.end("not found") }
}).listen(8899, () => console.log("http://localhost:8899"));
