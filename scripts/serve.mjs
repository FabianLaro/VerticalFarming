import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.pdf': 'application/pdf', '.json': 'application/json' }
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    let file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return }
    if (!(await stat(file)).isFile()) { res.writeHead(404); res.end(); return }
    const data = await readFile(file)
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' })
    res.end(data)
  } catch { res.writeHead(404); res.end('Datei nicht gefunden. Zuerst npm run build ausführen.') }
})
server.on('error', error => { console.error('Lokaler Start fehlgeschlagen:', error.message); process.exitCode = 1 })
server.listen(4173, '127.0.0.1', () => console.log('Stadtlabor 2040: http://127.0.0.1:4173 · Zum Beenden Strg+C'))
