import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const STYLES = [
  { id: 'monogram', label: 'Monograma', icon: 'fa-font' },
  { id: 'seal', label: 'Sello', icon: 'fa-certificate' },
  { id: 'ticket', label: 'Ticket', icon: 'fa-ticket' },
  { id: 'spark', label: 'Destello', icon: 'fa-wand-magic-sparkles' },
  { id: 'crown', label: 'Premium', icon: 'fa-crown' },
  { id: 'minimal', label: 'Minimal', icon: 'fa-circle' },
]

const FONTS = [
  { id: 'modern', label: 'Moderna', family: 'Arial, sans-serif' },
  { id: 'strong', label: 'Fuerte', family: 'Impact, Arial Black, sans-serif' },
  { id: 'elegant', label: 'Elegante', family: 'Georgia, serif' },
]

const PALETTES = [
  { label: 'Confianza', primary: '#185ADB', secondary: '#EE2B47' },
  { label: 'Premio', primary: '#14213D', secondary: '#FCA311' },
  { label: 'Fresco', primary: '#087F5B', secondary: '#20C997' },
  { label: 'Energía', primary: '#D9480F', secondary: '#FFD43B' },
  { label: 'Digital', primary: '#5F3DC4', secondary: '#15AABF' },
]

function initials(name) {
  return (name || 'Tu marca').trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
}

function polygon(ctx, cx, cy, outer, inner, points = 8) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = -Math.PI / 2 + (i * Math.PI) / points
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function fitText(ctx, text, maxWidth, startSize, weight, family) {
  let size = startSize
  do {
    ctx.font = `${weight} ${size}px ${family}`
    size -= 2
  } while (ctx.measureText(text).width > maxWidth && size > 28)
  return size + 2
}

function drawCrown(ctx, cx, cy, width) {
  const half = width / 2
  ctx.beginPath()
  ctx.moveTo(cx - half, cy + 55)
  ctx.lineTo(cx - half + 15, cy - 65)
  ctx.lineTo(cx - 55, cy - 5)
  ctx.lineTo(cx, cy - 85)
  ctx.lineTo(cx + 55, cy - 5)
  ctx.lineTo(cx + half - 15, cy - 65)
  ctx.lineTo(cx + half, cy + 55)
  ctx.closePath()
}

export default function LogoGenerator({ userId, name, primary, secondary, onUse, onColorsChange }) {
  const canvasRef = useRef(null)
  const [style, setStyle] = useState('monogram')
  const [font, setFont] = useState('modern')
  const [background, setBackground] = useState('gradient')
  const [tagline, setTagline] = useState('SORTEOS Y PREMIOS')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const fontFamily = FONTS.find(item => item.id === font)?.family || FONTS[0].family

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const size = canvas.width
    const darkText = background === 'light'
    const foreground = darkText ? primary : '#ffffff'
    const gradient = ctx.createLinearGradient(50, 30, size - 50, size - 30)
    gradient.addColorStop(0, primary)
    gradient.addColorStop(1, secondary)

    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = background === 'light' ? '#ffffff' : background === 'solid' ? primary : gradient
    roundedRect(ctx, 24, 24, size - 48, size - 48, style === 'minimal' ? 70 : 130)
    ctx.fill()

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = foreground
    ctx.strokeStyle = foreground
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const markY = 290
    const letters = initials(name)

    if (style === 'monogram') {
      ctx.font = `900 245px ${fontFamily}`
      ctx.fillText(letters, size / 2, markY)
      ctx.globalAlpha = 0.28
      ctx.lineWidth = 7
      ctx.beginPath()
      ctx.arc(size / 2, markY, 190, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    if (style === 'seal') {
      polygon(ctx, size / 2, markY, 190, 158, 20)
      ctx.fill()
      ctx.fillStyle = background === 'light' ? '#ffffff' : primary
      ctx.beginPath()
      ctx.arc(size / 2, markY, 130, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = background === 'light' ? primary : '#ffffff'
      ctx.font = `900 120px ${fontFamily}`
      ctx.fillText(letters, size / 2, markY + 5)
    }

    if (style === 'ticket') {
      roundedRect(ctx, 150, 165, 468, 260, 50)
      ctx.lineWidth = 25
      ctx.stroke()
      ctx.setLineDash([22, 18])
      ctx.beginPath()
      ctx.moveTo(290, 185)
      ctx.lineTo(290, 405)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.font = `900 132px ${fontFamily}`
      ctx.fillText(letters.slice(0, 1), 456, 297)
    }

    if (style === 'spark') {
      polygon(ctx, size / 2, markY, 195, 72, 8)
      ctx.fill()
      ctx.fillStyle = background === 'light' ? '#ffffff' : primary
      ctx.beginPath()
      ctx.arc(size / 2, markY, 68, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = background === 'light' ? primary : '#ffffff'
      ctx.font = `900 78px ${fontFamily}`
      ctx.fillText(letters.slice(0, 1), size / 2, markY + 4)
    }

    if (style === 'crown') {
      drawCrown(ctx, size / 2, markY, 350)
      ctx.fill()
      ctx.fillStyle = background === 'light' ? '#ffffff' : primary
      ctx.beginPath()
      ctx.arc(size / 2, markY + 25, 62, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = background === 'light' ? primary : '#ffffff'
      ctx.font = `900 75px ${fontFamily}`
      ctx.fillText(letters.slice(0, 1), size / 2, markY + 29)
    }

    if (style === 'minimal') {
      ctx.beginPath()
      ctx.arc(size / 2, markY, 155, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = background === 'light' ? '#ffffff' : primary
      ctx.font = `900 150px ${fontFamily}`
      ctx.fillText(letters, size / 2, markY + 4)
    }

    const brand = (name || 'Tu marca').trim().toUpperCase().slice(0, 28)
    ctx.fillStyle = foreground
    const brandSize = fitText(ctx, brand, 650, 64, font === 'elegant' ? 700 : 900, fontFamily)
    ctx.font = `${font === 'elegant' ? 700 : 900} ${brandSize}px ${fontFamily}`
    ctx.fillText(brand, size / 2, 555)

    const sub = tagline.trim().toUpperCase().slice(0, 36)
    if (sub) {
      ctx.globalAlpha = 0.78
      ctx.font = `700 25px Arial, sans-serif`
      ctx.fillText(sub, size / 2, 625)
      ctx.globalAlpha = 1
    }
  }, [name, primary, secondary, style, font, background, tagline, fontFamily])

  function canvasBlob() {
    return new Promise(resolve => canvasRef.current.toBlob(resolve, 'image/png', 1))
  }

  async function useLogo() {
    setBusy(true)
    setError('')
    const blob = await canvasBlob()
    if (!blob) {
      setError('No se pudo generar el archivo.')
      setBusy(false)
      return
    }

    const path = `white-label/${userId}/generated-logo-${Date.now()}.png`
    const { error: uploadError } = await supabase.storage.from('rifa-images').upload(path, blob, { contentType: 'image/png', upsert: true })

    if (uploadError) {
      setError(`No se pudo guardar el logo: ${uploadError.message}`)
    } else {
      const { data } = supabase.storage.from('rifa-images').getPublicUrl(path)
      onUse(data.publicUrl)
    }
    setBusy(false)
  }

  async function download() {
    const blob = await canvasBlob()
    if (!blob) return
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${(name || 'mi-marca').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-logo.png`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, marginTop: 4, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 18, marginBottom: 5 }}>Estudio de logotipos</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Diseños originales listos para perfil, web e impresión.</p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: primary, background: `${primary}12`, padding: '6px 9px', borderRadius: 6 }}>768 × 768 PNG</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', gap: 22, alignItems: 'start' }} className="logo-generator-grid">
        <canvas ref={canvasRef} width="768" height="768" style={{ width: 220, height: 220, maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>Eslogan opcional</label>
          <input value={tagline} onChange={event => setTagline(event.target.value)} maxLength={36} placeholder="Sorteos y premios"
            style={{ width: '100%', padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 7, marginBottom: 12, boxSizing: 'border-box' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, marginBottom: 12 }}>
            {STYLES.map(item => (
              <button key={item.id} type="button" onClick={() => setStyle(item.id)} title={item.label}
                style={{ border: style === item.id ? `2px solid ${primary}` : '1px solid var(--border)', background: style === item.id ? `${primary}12` : 'var(--card)', borderRadius: 7, padding: '8px 4px', cursor: 'pointer', color: 'var(--dark)' }}>
                <i className={`fas ${item.icon}`} style={{ display: 'block', marginBottom: 4, color: primary }} />
                <span style={{ fontSize: 10, fontWeight: 700 }}>{item.label}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 12 }}>
            <select value={font} onChange={event => setFont(event.target.value)} style={{ padding: 9, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--card)' }}>
              {FONTS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <select value={background} onChange={event => setBackground(event.target.value)} style={{ padding: 9, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--card)' }}>
              <option value="gradient">Fondo degradado</option>
              <option value="solid">Fondo sólido</option>
              <option value="light">Fondo blanco</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
            {PALETTES.map(palette => (
              <button key={palette.label} type="button" title={palette.label} onClick={() => onColorsChange(palette.primary, palette.secondary)}
                style={{ width: 34, height: 34, borderRadius: 7, border: '2px solid #fff', outline: '1px solid var(--border)', background: `linear-gradient(135deg, ${palette.primary} 50%, ${palette.secondary} 50%)`, cursor: 'pointer' }} />
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button type="button" onClick={useLogo} disabled={busy} style={{ border: 0, borderRadius: 8, padding: 11, color: '#fff', background: primary, fontWeight: 800, cursor: busy ? 'wait' : 'pointer' }}>
              {busy ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-check" style={{ marginRight: 7 }} />Usar logo</>}
            </button>
            <button type="button" onClick={download} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, background: 'var(--card)', color: 'var(--dark)', fontWeight: 700, cursor: 'pointer' }}>
              <i className="fas fa-download" style={{ marginRight: 7 }} />Descargar
            </button>
          </div>
        </div>
      </div>
      {error && <div style={{ color: '#c62828', fontSize: 12, marginTop: 10 }}>{error}</div>}
    </div>
  )
}
