/**
 * Generador de íconos PWA para TA’ DAO RD
 * Crea icon-192.png e icon-512.png con el gradiente de la marca
 * Uso: node scripts/generate-icons.mjs
 */
import { writeFileSync, mkdirSync } from 'fs'
import { deflateSync } from 'zlib'

// ── CRC32 (requerido por el formato PNG) ─────────────────────────────────────
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function makeChunk(type, data) {
  const typeB  = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length)
  const crcInput = Buffer.concat([typeB, data])
  const crcBuf   = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(crcInput))
  return Buffer.concat([lenBuf, typeB, data, crcBuf])
}

// ── Generador PNG con gradiente diagonal ────────────────────────────────────
function makePNG(size, colorTop, colorBot) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)  // ancho
  ihdr.writeUInt32BE(size, 4)  // alto
  ihdr[8]  = 8  // bit depth
  ihdr[9]  = 2  // color type RGB
  ihdr[10] = 0  // compression
  ihdr[11] = 0  // filter
  ihdr[12] = 0  // interlace

  // Datos de píxeles (filtro None = 0 al inicio de cada fila)
  const rowBytes = size * 3 + 1
  const raw      = Buffer.alloc(size * rowBytes)

  for (let y = 0; y < size; y++) {
    const t   = y / (size - 1)
    const r   = Math.round(colorTop[0] * (1 - t) + colorBot[0] * t)
    const g   = Math.round(colorTop[1] * (1 - t) + colorBot[1] * t)
    const b   = Math.round(colorTop[2] * (1 - t) + colorBot[2] * t)
    const off = y * rowBytes
    raw[off] = 0  // byte de filtro

    for (let x = 0; x < size; x++) {
      raw[off + 1 + x * 3]     = r
      raw[off + 1 + x * 3 + 1] = g
      raw[off + 1 + x * 3 + 2] = b
    }
  }

  const idat = deflateSync(raw)

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Colores del gradiente TA’ DAO RD: #006B3C → #FFB300 ──────────────────────
const azul = [0x00, 0x6b, 0x3c]
const rojo = [0xff, 0xb3, 0x00]

mkdirSync('public', { recursive: true })

writeFileSync('public/icon-192.png', makePNG(192, azul, rojo))
console.log('✓ public/icon-192.png creado (192×192)')

writeFileSync('public/icon-512.png', makePNG(512, azul, rojo))
console.log('✓ public/icon-512.png creado (512×512)')

console.log('\nÍconos PWA listos en la carpeta public/')
