import { useState, useEffect, useCallback } from 'react'
import { C, DEMO_RIFA } from '../constants'
import CountdownTimer from '../components/CountdownTimer'
import Confetti from '../components/Confetti'
import { useSEO } from '../hooks'

const PRIZE_LABELS = ['1er Premio', '2do Premio', '3er Premio']
const PRIZE_COLORS = [C.warning, C.primaryLight, C.accent]
const PRIZE_ICONS  = ['fa-crown', 'fa-medal', 'fa-award']

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

// ── WhatsApp modal ────────────────────────────────────────────────────────────
function WhatsAppModal({ onClose, referralCode, selected: _selected }) {
  const msg = encodeURIComponent(
    `¡Participa en la rifa de ${DEMO_RIFA.name}!\n\nTicket: RD$${DEMO_RIFA.price}\nSorteo: 20 Abril 2026\n\nEscoge tus números aquí:\nhttps://sorteosrd.com/rifa/demo\n\nUsa mi código de referido: ${referralCode} y obtendrás un descuento especial!`
  )
  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <i className="fab fa-whatsapp" style={{ color: '#fff', fontSize: 32 }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>Compartir por WhatsApp</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Mensaje pre-armado con tu link y código de referido</p>
      </div>
      <div style={{ background: 'var(--bg-alt)', borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
        ¡Participa en la rifa de {DEMO_RIFA.name}!<br />
        Ticket: RD${DEMO_RIFA.price} | Sorteo: 20 Abril 2026<br />
        Código referido: <strong style={{ color: C.primary }}>{referralCode}</strong>
      </div>
      <a href={`https://wa.me/?text=${msg}`} target="_blank" rel="noopener noreferrer"
        style={{ display: 'block', textAlign: 'center', background: '#25d366', color: '#fff', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
        <i className="fab fa-whatsapp" style={{ marginRight: 8 }} /> Abrir WhatsApp
      </a>
    </Modal>
  )
}

// ── Referral modal ────────────────────────────────────────────────────────────
function ReferralModal({ onClose, referralCode, referralCount }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <i className="fas fa-users" style={{ color: '#fff', fontSize: 28 }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Sistema de Referidos</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Invita amigos — ¡ambos ganan!</p>
      </div>

      <div style={{ background: C.gradient, borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>TU CÓDIGO DE REFERIDO</div>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: 3 }}>{referralCode}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.primary }}>{referralCount}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Referidos activos</div>
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.success }}>3</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Números gratis ganados</div>
        </div>
      </div>

      <div style={{ background: 'rgba(0,200,83,0.08)', borderRadius: 12, padding: 14, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.success, marginBottom: 6 }}><i className="fas fa-gift" style={{ marginRight: 6 }} />Beneficios</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Por cada 3 referidos que compren: <strong>1 número gratis</strong> para ti.<br />
          Tu referido obtiene <strong>10% de descuento</strong> en su primer ticket.
        </div>
      </div>

      <button onClick={copy} className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 15 }}>
        <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} style={{ marginRight: 8 }} />
        {copied ? '¡Copiado!' : 'Copiar Código'}
      </button>
    </Modal>
  )
}

// ── Widget modal ──────────────────────────────────────────────────────────────
function WidgetModal({ onClose, progress }) {
  const [copied, setCopied] = useState(false)
  const code = `<iframe src="https://sorteosrd.com/widget/demo" width="340" height="190" frameborder="0" style="border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.1)"></iframe>`
  const copy = () => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--dark)' }}>
        <i className="fas fa-code" style={{ color: C.primary, marginRight: 8 }} />Widget Embebible
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Pega este código en tu bio de Instagram, página web o cualquier sitio HTML.
      </p>

      {/* Preview */}
      <div style={{ background: C.gradient, borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>RIFA ACTIVA</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>PlayStation 5</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 50, fontSize: 11, fontWeight: 600, color: '#fff' }}>{progress}% vendido</div>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#fff', borderRadius: 3 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
          <span>${DEMO_RIFA.price}/ticket</span>
          <span>sorteosrd.com</span>
        </div>
      </div>

      <textarea readOnly value={code} style={{ width: '100%', padding: 14, borderRadius: 12, height: 80, resize: 'none', fontSize: 12, fontFamily: 'monospace', marginBottom: 16 }} />
      <button onClick={copy} className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 15 }}>
        <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} style={{ marginRight: 8 }} />
        {copied ? '¡Copiado!' : 'Copiar Código HTML'}
      </button>
    </Modal>
  )
}

// ── Checkout modal ────────────────────────────────────────────────────────────
function CheckoutModal({ onClose, selected, onConfirm }) {
  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--dark)' }}>Confirmar Apartado</h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
        Tienes <strong>24 horas</strong> para confirmar el pago o los números se liberan automáticamente.
      </p>

      {[
        { placeholder: 'Tu nombre completo', type: 'text' },
        { placeholder: 'WhatsApp o teléfono', type: 'tel' },
        { placeholder: 'Email (opcional)', type: 'email' },
        { placeholder: 'Código de referido (opcional)', type: 'text' },
      ].map((f, i) => (
        <input key={i} type={f.type} placeholder={f.placeholder} style={{ width: '100%', padding: '13px 16px', marginBottom: 12, fontSize: 14 }} />
      ))}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {[...selected].sort((a, b) => a - b).map(n => (
          <span key={n} style={{ background: 'rgba(217,11,36,0.1)', color: C.primary, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
            #{String(n).padStart(3, '0')}
          </span>
        ))}
      </div>

      <div style={{ background: 'rgba(255,193,7,0.08)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="fas fa-clock" style={{ color: C.warning, fontSize: 18 }} />
        <span style={{ fontSize: 13, color: C.warning, fontWeight: 600 }}>Temporizador: 24 horas para confirmar pago</span>
      </div>

      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', textAlign: 'center', marginBottom: 20 }}>
        Total: RD${(selected.size * DEMO_RIFA.price).toLocaleString()}
      </div>

      <button onClick={onConfirm} className="btn-primary" style={{ width: '100%', padding: '16px', borderRadius: 12, fontSize: 16 }}>
        <i className="fas fa-check" style={{ marginRight: 8 }} /> Confirmar y Apartar
      </button>
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DemoPage() {
  useSEO({
    title: 'Demo — Prueba el Talonario Digital',
    description: 'Prueba gratis cómo funciona RyffasRD. Elige números, ve el progreso en tiempo real y experimenta el sorteo certificado.',
  })
  const TOTAL = DEMO_RIFA.total
  const [tickets, setTickets] = useState(() => {
    const t = {}
    const sold = new Set()
    while (sold.size < 105) sold.add(Math.floor(Math.random() * TOTAL))
    sold.forEach(n => { t[n] = { status: 'sold', buyer: 'Participante' } })
    return t
  })
  const [selected,      setSelected]      = useState(new Set())
  const [range,         setRange]         = useState(0)
  const [searchNum,     setSearchNum]     = useState('')
  const [sorteoActive,  setSorteoActive]  = useState(false)
  const [winners,       setWinners]       = useState([])
  const [currentIdx,    setCurrentIdx]    = useState(0)
  const [confetti,      setConfetti]      = useState(false)
  const [reserved,      setReserved]      = useState({})   // { num: expireTimestamp }
  const [modal,         setModal]         = useState(null) // 'checkout' | 'whatsapp' | 'referral' | 'widget'
  const [referralCode]  = useState(() => 'SRD-' + Math.random().toString(36).substr(2, 6).toUpperCase())

  const rangeSize   = 100
  const rangeStart  = range * rangeSize
  const rangeEnd    = Math.min(rangeStart + rangeSize, TOTAL)
  const totalRanges = Math.ceil(TOTAL / rangeSize)
  const soldCount   = Object.keys(tickets).length
  const progress    = Math.round((soldCount / TOTAL) * 100)

  // Release reserved tickets on timer expiry
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      setReserved(prev => {
        const next = { ...prev }
        let changed = false
        Object.entries(next).forEach(([k, exp]) => { if (now > exp) { delete next[k]; changed = true } })
        return changed ? next : prev
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const toggleTicket = useCallback((num) => {
    if (tickets[num]) return
    setSelected(prev => {
      const s = new Set(prev)
      s.has(num) ? s.delete(num) : s.add(num)
      return s
    })
  }, [tickets])

  const confirmTickets = () => {
    const now = Date.now()
    setTickets(prev => {
      const t = { ...prev }
      selected.forEach(n => { t[n] = { status: 'reserved', buyer: 'Tú' } })
      return t
    })
    setReserved(prev => {
      const r = { ...prev }
      selected.forEach(n => { r[n] = now + 86400000 }) // +24h
      return r
    })
    setSelected(new Set())
    setModal(null)
  }

  const doSorteo = () => {
    setSorteoActive(true)
    setWinners([])
    const soldNums = Object.entries(tickets).filter(([, v]) => v.status === 'sold').map(([k]) => Number(k))
    if (soldNums.length < 3) { setSorteoActive(false); return }

    const used = new Set()
    const allWinners = []

    const runRound = (idx) => {
      let count = 0
      const interval = setInterval(() => {
        setWinners(_prev => { const w = [...allWinners]; w[idx] = soldNums[Math.floor(Math.random() * soldNums.length)]; return w })
        setCurrentIdx(idx)
        count++
        if (count > 25) {
          clearInterval(interval)
          let final
          do { final = soldNums[Math.floor(Math.random() * soldNums.length)] } while (used.has(final))
          used.add(final)
          allWinners[idx] = final
          setWinners([...allWinners])
          if (idx < 2) setTimeout(() => runRound(idx + 1), 900)
          else { setSorteoActive(false); setConfetti(true); setTimeout(() => setConfetti(false), 4000) }
        }
      }, 80)
    }
    runRound(0)
  }

  return (
    <section style={{ paddingTop: 90, minHeight: '100vh', background: 'var(--bg-alt)' }} className="page-enter">
      <Confetti active={confetti} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Header banner ── */}
        <div className="demo-banner" style={{ background: C.gradient, borderRadius: 24, padding: '40px 48px', marginBottom: 24, display: 'flex', gap: 40, alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500, letterSpacing: 1, marginBottom: 4 }}>RIFA DE DEMOSTRACIÓN — 3 PREMIOS</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{DEMO_RIFA.name}</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>{DEMO_RIFA.description}</p>
            <div style={{ display: 'flex', gap: 32, marginTop: 20 }}>
              {[{ v: soldCount, l: 'Vendidos' }, { v: TOTAL - soldCount, l: 'Disponibles' }, { v: `$${DEMO_RIFA.price}`, l: 'Por ticket' }].map((s, i) => (
                <div key={i}><div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{s.v}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{s.l}</div></div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: 1 }}>SORTEO EN</div>
            <CountdownTimer targetDate={DEMO_RIFA.sorteoDate} dark />
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={() => setModal('whatsapp')} style={{ background: '#25d366', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fab fa-whatsapp" style={{ fontSize: 18 }} /> Compartir por WhatsApp
          </button>
          <button onClick={() => setModal('referral')} className="btn-primary" style={{ padding: '10px 20px', borderRadius: 12, fontSize: 13 }}>
            <i className="fas fa-users" style={{ marginRight: 6 }} /> Mis Referidos (7)
          </button>
          <button onClick={() => setModal('widget')} className="btn-outline" style={{ padding: '10px 20px', borderRadius: 12, fontSize: 13 }}>
            <i className="fas fa-code" style={{ marginRight: 6 }} /> Widget Embebible
          </button>
        </div>

        {/* ── Progress bar ── */}
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: '18px 28px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>Progreso de la rifa</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>{progress}%</span>
          </div>
          <div style={{ height: 10, background: 'var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: C.gradient, borderRadius: 10, transition: 'width 0.5s' }} />
          </div>
        </div>

        <div className="demo-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

          {/* ── Ticket grid ── */}
          <div style={{ background: 'var(--card)', borderRadius: 20, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--dark)' }}>Escoge tus Números</h2>
              <input placeholder="Buscar #" value={searchNum} onChange={e => setSearchNum(e.target.value)}
                style={{ padding: '8px 14px', fontSize: 13, width: 100 }} />
            </div>

            {/* Range tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {Array.from({ length: totalRanges }, (_, i) => (
                <button key={i} onClick={() => setRange(i)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: range === i ? C.primary : 'var(--bg-alt)', color: range === i ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
                  {i * rangeSize}–{Math.min((i + 1) * rangeSize - 1, TOTAL - 1)}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 11 }}>
              {[{ color: 'var(--bg-alt)', label: 'Disponible' }, { color: C.primary, label: 'Vendido' }, { color: C.secondary, label: 'Tu selección' }, { color: C.warning, label: 'Reservado 24h' }].map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
                  <div style={{ width: 14, height: 14, borderRadius: 4, background: l.color }} /> {l.label}
                </div>
              ))}
            </div>

            {/* Numbers */}
            <div className="ticket-numbers" style={{ display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: 5 }}>
              {Array.from({ length: rangeEnd - rangeStart }, (_, i) => {
                const num       = rangeStart + i
                const t         = tickets[num]
                const isSold    = t?.status === 'sold'
                const isReserved = t?.status === 'reserved'
                const isSel     = selected.has(num)
                const match     = searchNum && String(num).padStart(3, '0').includes(searchNum)
                const timer     = reserved[num]
                const timeLeft  = timer ? Math.max(0, Math.floor((timer - Date.now()) / 1000)) : 0

                return (
                  <div key={num} onClick={() => toggleTicket(num)}
                    title={isReserved ? `Reservado — ${Math.floor(timeLeft / 3600)}h ${Math.floor((timeLeft % 3600) / 60)}m restantes` : ''}
                    style={{
                      aspectRatio: '1', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 600,
                      cursor: (isSold || isReserved) ? 'not-allowed' : 'pointer',
                      background: isSel ? C.secondary : isSold ? C.primary : isReserved ? C.warning : match ? 'rgba(217,11,36,0.15)' : 'var(--bg-alt)',
                      color: (isSel || isSold || isReserved) ? '#fff' : 'var(--text-secondary)',
                      transition: 'all 0.15s',
                      transform: isSel ? 'scale(1.08)' : 'scale(1)',
                      animation: isSel ? 'ticketAppear 0.2s ease-out' : 'none',
                    }}>
                    {String(num).padStart(3, '0')}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div>
            {/* Selection summary */}
            <div style={{ background: 'var(--card)', borderRadius: 20, padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--dark)' }}>
                <i className="fas fa-ticket" style={{ color: C.primary, marginRight: 8 }} />Tu Selección ({selected.size})
              </h3>

              {selected.size === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', padding: '16px 0' }}>Haz clic en los números para seleccionarlos</p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {[...selected].sort((a, b) => a - b).map(n => (
                      <span key={n} style={{ background: C.secondary, color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                        #{String(n).padStart(3, '0')}
                      </span>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Tickets × {selected.size}</span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>${selected.size * DEMO_RIFA.price}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>Total</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: C.primary }}>${selected.size * DEMO_RIFA.price}</span>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,193,7,0.1)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fas fa-clock" style={{ color: C.warning }} />
                    <span style={{ fontSize: 12, color: C.warning, fontWeight: 600 }}>24h para confirmar o se liberan</span>
                  </div>
                  <button onClick={() => setModal('checkout')} className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 15 }}>
                    Apartar Números <i className="fas fa-arrow-right" style={{ marginLeft: 6 }} />
                  </button>
                </>
              )}
            </div>

            {/* Multi-prize sorteo */}
            <div style={{ background: '#1a1a2e', borderRadius: 20, padding: 24, color: '#fff' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-trophy" style={{ color: C.warning }} /> Sorteo Multi-Premio
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {PRIZE_LABELS.map((label, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${winners[i] != null && !sorteoActive ? PRIZE_COLORS[i] + '40' : 'rgba(255,255,255,0.08)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className={`fas ${PRIZE_ICONS[i]}`} style={{ color: PRIZE_COLORS[i], fontSize: 16 }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: PRIZE_COLORS[i], minWidth: 50, textAlign: 'right', animation: sorteoActive && currentIdx <= i ? 'countPulse 0.15s infinite' : 'none' }}>
                      {winners[i] != null ? `#${String(winners[i]).padStart(3, '0')}` : '—'}
                    </span>
                  </div>
                ))}
              </div>
              <button onClick={doSorteo} disabled={sorteoActive} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: sorteoActive ? '#3a3a5a' : C.gradientHot, color: '#fff', fontSize: 15, fontWeight: 700, cursor: sorteoActive ? 'wait' : 'pointer', boxShadow: '0 4px 15px rgba(0,75,204,0.3)' }}>
                {sorteoActive
                  ? <><i className="fas fa-spinner" style={{ animation: 'spinSlow 1s linear infinite', marginRight: 8 }} />Sorteando...</>
                  : <><i className="fas fa-shuffle" style={{ marginRight: 8 }} />Iniciar Sorteo (3 Premios)</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 60 }} />

      {/* ── Modals ── */}
      {modal === 'checkout'  && <CheckoutModal  onClose={() => setModal(null)} selected={selected} onConfirm={confirmTickets} />}
      {modal === 'whatsapp'  && <WhatsAppModal  onClose={() => setModal(null)} referralCode={referralCode} selected={selected} />}
      {modal === 'referral'  && <ReferralModal  onClose={() => setModal(null)} referralCode={referralCode} referralCount={7} />}
      {modal === 'widget'    && <WidgetModal    onClose={() => setModal(null)} progress={progress} />}
    </section>
  )
}
