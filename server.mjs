import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import cuadre from './api/cuadre.js'

const root = resolve('dist')
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }

createServer(async (req, res) => {
  res.status = code => { res.statusCode = code; return res }
  res.json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)) }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    if (pathname === '/healthz') return res.json({ status: 'ok' })
    if (pathname === '/api/cuadre') {
      if (req.method === 'POST') {
        let body = ''
        for await (const chunk of req) {
          body += chunk
          if (Buffer.byteLength(body) > 1048576) return res.status(413).json({ error: 'Solicitud demasiado grande' })
        }
        try { req.body = JSON.parse(body || '{}') } catch { return res.status(400).json({ error: 'JSON invalido' }) }
      }
      return await cuadre(req, res)
    }
    if (pathname.startsWith('/api/')) return res.status(404).json({ error: 'Ruta no encontrada' })
    if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).json({ error: 'Metodo no permitido' })
    let file = resolve(root, '.' + pathname)
    if (file !== root && !file.startsWith(root + sep)) return res.status(403).json({ error: 'Acceso denegado' })
    try { if (!(await stat(file)).isFile()) file = resolve(root, 'index.html') } catch {
      if (extname(pathname)) return res.status(404).json({ error: 'Archivo no encontrado' })
      file = resolve(root, 'index.html')
    }
    const data = await readFile(file)
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream')
    res.setHeader('Cache-Control', pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache')
    res.end(req.method === 'HEAD' ? undefined : data)
  } catch (error) {
    console.error(error.message)
    if (!res.headersSent) res.status(500).json({ error: 'Error del servidor' })
    else res.end()
  }
}).listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('RyffasRD server ready'))
