import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import { supabase } from '../lib/supabase'
import { C, RIFA_CATEGORIES } from '../constants'
import { useSEO } from '../hooks'
import { useAuth } from '../context/AuthContext'
import CryptoPaymentDetails from '../components/CryptoPaymentDetails'
import { cryptoPaymentDetails } from '../lib/cryptoPayments'

const fmt = (n) => `RD$${Number(n).toLocaleString()}`
const SITE_URL = import.meta.env.VITE_APP_URL || window.location.origin

// ── Estado de un número ───────────────────────────────────────────────────────
// 'free' | 'reserved' | 'paid' | 'selected' (selección local)

export default function RifaPage() {
  const { slug }       = useParams()
  const navigate       = useNavigate()
  const [rifa, setRifa]       = useState(null)
  const [tickets, setTickets] = useState({})   // { numero: status }
  const [selected, setSelected] = useState([]) // números seleccionados localmente
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [step, setStep]       = useState('grid') // 'grid' | 'form' | 'success'
  const [form, setForm]       = useState({ name: '', phone: '', email: '', payment_method: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [reservedNums, setReservedNums] = useState([])
  const [reservedTickets, setReservedTickets] = useState([])
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptState, setReceiptState] = useState({ status: 'idle', message: '' })
  const [qrCodes, setQrCodes] = useState({})
  const [orgPhone, setOrgPhone]             = useState('')
  const [orgProfile, setOrgProfile]         = useState(null)
  const [paymentMethods, setPaymentMethods] = useState([]) // full objects { id, name, type, details }
  const [activeImage, setActiveImage]       = useState(null)
  const { user } = useAuth()
  const isAdmin = user && rifa && user.id === rifa.user_id && !rifa.is_test

  useSEO({
    title: rifa ? rifa.name : 'Rifa',
    description: rifa ? `Participa en "${rifa.name}". Precio por número: RD$${rifa.price}. ¡Aparta tu número ahora!` : 'Participa en esta rifa digital en RyffasRD.',
    image: rifa?.image_url || undefined,
    url: `${SITE_URL}/rifa/${slug}`,
    type: 'article',
  })

  useEffect(() => { loadRifa() }, [slug])

  useEffect(() => {
    if (step !== 'grid') return
    const timer = setInterval(() => loadRifa(true), 30000)
    return () => clearInterval(timer)
  }, [slug, step])

  useEffect(() => {
    let cancelled = false
    async function createQrCodes() {
      const pairs = await Promise.all(reservedTickets.map(async (ticket) => {
        const url = `${SITE_URL}/ticket/${ticket.ticket_code}`
        const image = await QRCode.toDataURL(url, { width: 180, margin: 1, color: { dark: '#D90B24', light: '#FFFFFF' } })
        return [ticket.ticket_code, image]
      }))
      if (!cancelled) setQrCodes(Object.fromEntries(pairs))
    }
    if (reservedTickets.length) createQrCodes()
    return () => { cancelled = true }
  }, [reservedTickets])

  async function loadRifa(silent = false) {
    if (!silent) { setLoading(true); setError('') }
    const { data, error: requestError } = await supabase.rpc('public_rifa_details', { p_slug: slug })
    if (requestError || !data?.rifa) {
      if (silent) return
      setError('Rifa no encontrada o no disponible')
      setLoading(false)
      return
    }
    setRifa(data.rifa)
    setOrgPhone(data.organizer?.phone || '')
    setOrgProfile(data.organizer || null)
    setPaymentMethods(data.payment_methods || [])
    const map = {}
    data.tickets?.forEach(t => { map[t.numero] = t.status })
    setTickets(map)
    setSelected(prev => prev.filter(n => !map[n]))
    setLoading(false)
  }

  function toggleNum(n) {
    if (tickets[n] === 'reserved' || tickets[n] === 'paid') return
    if (!selected.includes(n) && selected.length >= 100) {
      setSubmitError('Solo puedes reservar hasta 100 numeros a la vez')
      return
    }
    setSelected(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    )
  }

  async function handleReserve() {
    setSubmitError('')
    if (!form.name.trim() || !form.phone.trim() || !form.payment_method) {
      setSubmitError('Nombre, teléfono y método de pago son requeridos')
      return
    }
    setSubmitting(true)
    try {
      const { data, error: err } = await supabase.rpc('reserve_tickets', {
        p_rifa_id: rifa.id,
        p_numbers: selected,
        p_buyer_name: form.name,
        p_buyer_phone: form.phone,
        p_buyer_email: form.email || null,
        p_payment_method: form.payment_method,
      })
      if (err) throw err
      const reservation = data || []
      setReservedTickets(reservation)
      setReservedNums(reservation.map(ticket => ticket.numero))
      setReceiptFile(null)
      setReceiptState({ status: 'idle', message: '' })
      setStep('success')
    } catch (err) {
      setSubmitError(err.message.includes('unique') ? 'Uno o más números ya fueron tomados. Elige otros.' : err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAdminBlock() {
    if (!isAdmin) return
    setSubmitError('')
    setSubmitting(true)
    try {
      const { error: blockError } = await supabase.rpc('reserve_tickets', {
        p_rifa_id: rifa.id,
        p_numbers: selected,
        p_buyer_name: 'Reservado por organizador',
        p_buyer_phone: orgPhone || 'N/A',
        p_payment_method: paymentMethods[0]?.name || null,
      })
      if (blockError) throw blockError

      alert(`Se han reservado ${selected.length} numero(s). El pago se confirma desde el panel.`)
      setSelected([])
      setStep('grid')
      loadRifa()
    } catch (err) {
      setSubmitError(err.message.includes('unique') ? 'Uno o más números ya fueron tomados.' : err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function getSelectedMethod() {
    return paymentMethods.find(m => m.name === form.payment_method) || null
  }

  function buildWhatsApp() {
    if (rifa.is_test) return '#'
    const nums  = reservedNums.map(n => `#${String(n).padStart(4,'0')}`).join(', ')
    const total = fmt(reservedNums.length * rifa.price)
    const m     = getSelectedMethod()

    let payLine = `💳 Método de pago: ${form.payment_method}`
    if (m?.type === 'bank' && m.details) {
      const t = { ahorros: 'Ahorros', corriente: 'Corriente', nomina: 'Nómina' }[m.details.account_type] || m.details.account_type
      const ced = m.details.cedula ? `\n   Cédula: ${m.details.cedula}` : ''
      payLine += `\n   Tipo: ${t}\n   Cuenta: ${m.details.account_number}\n   Titular: ${m.details.holder}${ced}`
    } else if (m?.type === 'paypal' && m.details?.email) {
      payLine += `\n   PayPal: ${m.details.email}`
    } else if (m?.type === 'crypto') {
      const payment = cryptoPaymentDetails(m)
      if (payment) payLine += `\n   Red: ${payment.networkLabel}\n   Wallet: ${payment.wallet}\n   Importe cripto a acordar; precio expresado en RD$.`
    }

    const msg = encodeURIComponent(
      `¡Hola! Quiero apartar mis números para la rifa *${rifa.name}*\n\n` +
      `📋 Nombre: ${form.name}\n` +
      `🎫 Números: ${nums}\n` +
      `💰 Total: ${total}\n` +
      `${payLine}\n\n` +
      `Por favor confirma mi apartado. ¡Gracias!`
    )
    const phone = orgPhone.replace(/\D/g, '')
    return phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`
  }

  async function handleReceiptUpload() {
    if (!receiptFile || !reservedTickets.length) return
    const accepted = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'].includes(receiptFile.type)
    if (!accepted || receiptFile.size > 8 * 1024 * 1024) {
      setReceiptState({ status: 'error', message: 'Sube una imagen o PDF de hasta 8 MB.' })
      return
    }

    setReceiptState({ status: 'uploading', message: '' })
    try {
      const primaryCode = reservedTickets[0].ticket_code
      const safeName = receiptFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `receipts/${primaryCode}/${Date.now()}-${safeName}`
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(path, receiptFile, { upsert: false, contentType: receiptFile.type })
      if (uploadError) throw uploadError

      const { error: receiptError } = await supabase.rpc('attach_ticket_receipt', {
        p_ticket_ids: reservedTickets.map(ticket => ticket.id),
        p_ticket_code: primaryCode,
        p_receipt_path: path,
      })
      if (receiptError) throw receiptError
      setReceiptState({ status: 'success', message: 'Comprobante enviado. El organizador lo revisará pronto.' })
    } catch (uploadError) {
      setReceiptState({ status: 'error', message: uploadError.message || 'No se pudo enviar el comprobante.' })
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <i className="fas fa-spinner fa-spin" style={{ fontSize: 32, color: C.primary }} />
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <i className="fas fa-ticket-slash" style={{ fontSize: 48, color: 'var(--text-secondary)' }} />
      <h2 style={{ color: 'var(--dark)', fontSize: 24, fontWeight: 700 }}>{error}</h2>
      <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '12px 28px' }}>Ir al Inicio</button>
    </div>
  )

  const sold   = Object.values(tickets).filter(s => s === 'paid').length
  const reserved = Object.values(tickets).filter(s => s === 'reserved').length
  const pct    = Math.round((sold / rifa.total) * 100)

  const displayImage = activeImage || rifa?.image_url
  const gallery = rifa?.gallery_urls?.length > 0 ? rifa.gallery_urls : (rifa?.image_url ? [rifa.image_url] : [])
  const brandName = orgProfile?.brand_name || orgProfile?.name || 'Organizador Independiente'
  const brandLogo = orgProfile?.brand_logo_url || orgProfile?.avatar_url
  const brandCover = orgProfile?.brand_cover_url
  const brandPrimary = orgProfile?.brand_primary_color || C.primary
  const brandSecondary = orgProfile?.brand_secondary_color || C.accent
  const brandGradient = `linear-gradient(135deg, ${brandPrimary}, ${brandSecondary})`
  const category = RIFA_CATEGORIES.find(item => item.value === (rifa.category || 'other')) || RIFA_CATEGORIES[RIFA_CATEGORIES.length - 1]

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (step === 'success') return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 60px' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ width: 80, height: 80, background: 'rgba(0,200,83,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <i className="fas fa-check" style={{ fontSize: 36, color: C.success }} />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--dark)', marginBottom: 12 }}>¡Números apartados!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 8 }}>
          Tus números: <strong style={{ color: C.primary }}>{reservedNums.map(n => `#${String(n).padStart(4,'0')}`).join(', ')}</strong>
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 20 }}>
          Total a pagar: <strong style={{ color: C.success, fontSize: 22 }}>{fmt(reservedNums.length * rifa.price)}</strong>
          <br /><span style={{ fontSize: 13 }}>Tienes 24 horas para confirmar el pago.</span>
        </p>

        {/* Detalles del método de pago en la pantalla de éxito */}
        {(() => {
          const sel = getSelectedMethod()
          if (!sel && !form.payment_method) return null
          return (
            <div style={{ background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.25)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.success, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <i className="fas fa-credit-card" style={{ marginRight: 8 }} />Instrucciones de pago
              </div>
              {sel?.type === 'bank' && sel.details && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, color: 'var(--dark)' }}>
                  <div><strong>Banco:</strong> {sel.name}</div>
                  <div><strong>Tipo:</strong> {{ ahorros: 'Cuenta de Ahorros', corriente: 'Cuenta Corriente', nomina: 'Cuenta Nómina' }[sel.details.account_type]}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong>No. Cuenta:</strong>
                    <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.06)', padding: '2px 10px', borderRadius: 6, fontSize: 15, letterSpacing: 1 }}>{sel.details.account_number}</span>
                  </div>
                  <div><strong>Titular:</strong> {sel.details.holder}</div>
                  {sel.details.cedula && <div><strong>Cédula:</strong> {sel.details.cedula}</div>}
                </div>
              )}
              {sel?.type === 'paypal' && sel.details?.email && (
                <div style={{ fontSize: 14, color: 'var(--dark)' }}>
                  <i className="fab fa-paypal" style={{ marginRight: 8, color: '#003087' }} />
                  Envía el pago a: <strong>{sel.details.email}</strong>
                </div>
              )}
              {sel?.type === 'crypto' && <CryptoPaymentDetails method={sel} />}
              {(!sel || sel.type === 'custom') && form.payment_method && (
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Método: <strong>{form.payment_method}</strong>. Coordina los detalles por WhatsApp con el organizador.
                </div>
              )}
            </div>
          )
         })()}

        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '18px 20px', marginBottom: 20, textAlign: 'left' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)', marginBottom: 6 }}>
            <i className="fas fa-receipt" style={{ color: C.primary, marginRight: 8 }} />Envía tu comprobante
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Adjunta la captura o PDF de tu pago. Solo el organizador de esta rifa podrá verlo.</p>
          <input type="file" accept="image/*,application/pdf" onChange={event => {
            setReceiptFile(event.target.files?.[0] || null)
            setReceiptState({ status: 'idle', message: '' })
          }} style={{ width: '100%', fontSize: 13, marginBottom: 12 }} />
          <button onClick={handleReceiptUpload} disabled={!receiptFile || receiptState.status === 'uploading' || receiptState.status === 'success'}
            style={{ width: '100%', border: 'none', borderRadius: 8, padding: '11px 14px', cursor: !receiptFile || receiptState.status === 'uploading' || receiptState.status === 'success' ? 'not-allowed' : 'pointer', opacity: !receiptFile || receiptState.status === 'uploading' || receiptState.status === 'success' ? .6 : 1, background: C.primary, color: '#fff', fontWeight: 700 }}>
            {receiptState.status === 'uploading' ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 7 }} />Enviando...</> : <><i className="fas fa-cloud-arrow-up" style={{ marginRight: 7 }} />Enviar comprobante</>}
          </button>
          {receiptState.message && <p style={{ margin: '10px 0 0', fontSize: 13, color: receiptState.status === 'success' ? C.success : '#b42318' }}>{receiptState.message}</p>}
        </div>

        {reservedTickets.length > 0 && (
          <div style={{ textAlign: 'left', marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, color: 'var(--dark)', marginBottom: 10 }}>Tus tickets verificables</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
              {reservedTickets.map(ticket => (
                <a key={ticket.id} href={`/ticket/${ticket.ticket_code}`} target="_blank" rel="noreferrer" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {qrCodes[ticket.ticket_code] && <img src={qrCodes[ticket.ticket_code]} alt={`QR de ticket ${ticket.numero}`} style={{ width: 54, height: 54, background: '#fff', borderRadius: 4 }} />}
                  <span><strong style={{ display: 'block', color: C.primary }}>#{String(ticket.numero).padStart(4, '0')}</strong><small style={{ color: 'var(--text-secondary)' }}>{ticket.ticket_code}</small></span>
                </a>
              ))}
            </div>
          </div>
        )}

        {!rifa.is_test && <a href={buildWhatsApp()} target="_blank" rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#25d366', color: '#fff', padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: 'none', marginBottom: 16 }}>
          <i className="fab fa-whatsapp" style={{ fontSize: 22 }} />
          Confirmar pago por WhatsApp
        </a>}
        {rifa.is_test && <p role="status">PRUEBA PRIVADA - Sin pago ni premio real</p>}
        <br />
        <button onClick={() => { setStep('grid'); setSelected([]); loadRifa() }}
          style={{ marginTop: 8, background: 'none', border: 'none', color: C.primary, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          Volver al talonario →
        </button>
      </div>
    </section>
  )

  // ── FORM ──────────────────────────────────────────────────────────────────
  if (step === 'form') return (
    <section style={{ minHeight: '100vh', padding: '120px 24px 60px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <button onClick={() => setStep('grid')} style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 24 }}>
          <i className="fas fa-arrow-left" style={{ marginRight: 6 }} />Volver
        </button>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--dark)', marginBottom: 8 }}>Confirma tu apartado</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Números: <strong style={{ color: C.primary }}>{selected.map(n => `#${String(n).padStart(4,'0')}`).join(', ')}</strong>
          <br />Total: <strong style={{ color: C.success }}>{fmt(selected.length * rifa.price)}</strong>
        </p>
        <div style={{ background: 'var(--card)', borderRadius: 20, padding: 32, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--card-border)' }}>
          {[
            { label: 'Nombre completo *', key: 'name', placeholder: 'Tu nombre', type: 'text' },
            { label: 'WhatsApp *',        key: 'phone', placeholder: '+1 809 000 0000', type: 'tel' },
            { label: 'Email (opcional)',  key: 'email', placeholder: 'tu@email.com', type: 'email' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--dark)', fontSize: 15, boxSizing: 'border-box', outline: 'none' }} />
            </div>
          ))}

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>Método de Pago *</label>
            {paymentMethods.length === 0 ? (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(217,11,36,0.07)', border: '1.5px dashed var(--border)', color: 'var(--text-secondary)', fontSize: 14 }}>
                <i className="fas fa-info-circle" style={{ marginRight: 8, color: C.primary }} />
                El organizador no ha configurado métodos de pago aún. Contáctalo por WhatsApp.
              </div>
            ) : (
              <>
                <select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-alt)', color: form.payment_method ? 'var(--dark)' : 'var(--text-secondary)', fontSize: 15, boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}>
                  <option value="">Selecciona un método...</option>
                  {paymentMethods.map(m => (
                    <option key={m.id || m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
                {/* Detalles del método seleccionado */}
                {(() => {
                  const sel = getSelectedMethod()
                  if (!sel) return null
                  return (
                    <div style={{ marginTop: 10, padding: '14px 16px', borderRadius: 10, background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.25)' }}>
                      {sel.type === 'bank' && sel.details && (
                        <div style={{ fontSize: 14, color: 'var(--dark)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span><strong>Banco:</strong> {sel.name}</span>
                          <span><strong>Tipo:</strong> {{ ahorros: 'Cuenta de Ahorros', corriente: 'Cuenta Corriente', nomina: 'Cuenta Nómina' }[sel.details.account_type] || sel.details.account_type}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <strong>No. Cuenta:</strong>
                            <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 6, letterSpacing: 1 }}>{sel.details.account_number}</span>
                          </span>
                          <span><strong>Titular:</strong> {sel.details.holder}</span>
                        </div>
                      )}
                      {sel.type === 'paypal' && sel.details?.email && (
                        <div style={{ fontSize: 14, color: 'var(--dark)' }}>
                          <i className="fab fa-paypal" style={{ marginRight: 8, color: '#003087' }} />
                          <strong>PayPal:</strong> {sel.details.email}
                        </div>
                      )}
                      {sel.type === 'crypto' && <CryptoPaymentDetails method={sel} />}
                      {sel.type === 'custom' && (
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                          <i className="fas fa-money-bill-wave" style={{ marginRight: 8, color: C.success }} />
                          Contacta al organizador por WhatsApp para coordinar el pago por {sel.name}.
                        </div>
                      )}
                    </div>
                  )
                })()}
              </>
            )}
          </div>

          {submitError && (
            <div style={{ background: 'rgba(255,101,101,0.1)', border: '1px solid rgba(255,101,101,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#ff6565', fontSize: 14 }}>
              <i className="fas fa-circle-exclamation" style={{ marginRight: 8 }} />{submitError}
            </div>
          )}

          <button onClick={handleReserve} disabled={submitting} className="btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700, border: 'none', opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}>
            {submitting
              ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Reservando...</>
              : <><i className="fas fa-lock" style={{ marginRight: 8 }} />Apartar {selected.length} número{selected.length !== 1 ? 's' : ''}</>
            }
          </button>
          {isAdmin && (
            <button onClick={handleAdminBlock} disabled={submitting}
              style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700, border: 'none', opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer', background: C.success, color: '#fff', marginTop: 12 }}>
              {submitting
                ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Bloqueando...</>
                : <><i className="fas fa-shield-halved" style={{ marginRight: 8 }} />Bloquear como Administrador</>
              }
            </button>
          )}
        </div>
      </div>
    </section>
  )

  // ── GRID ──────────────────────────────────────────────────────────────────
  return (
    <section style={{ minHeight: '100vh', padding: '100px 24px 60px', background: 'var(--bg-alt)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Organizador */}
        {orgProfile && (
          <div style={{ background: brandCover ? `linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.35)), url(${brandCover}) center/cover` : brandGradient, minHeight: 130, borderRadius: 8, padding: 24, display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 20, color: '#fff' }}>
            {brandLogo ? (
              <img src={brandLogo} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '3px solid #fff', background: '#fff' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 8, background: 'rgba(255,255,255,.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>
                {brandName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontSize: 12, opacity: .82, fontWeight: 600 }}>Organizado por</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{brandName}</div>
            </div>
          </div>
        )}

        {/* Header de la rifa */}
        <div style={{ background: 'var(--card)', borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', marginBottom: 28 }}>
          {displayImage && (
            <div style={{ height: 260, overflow: 'hidden', position: 'relative' }}>
              <img src={displayImage} alt={rifa.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
              <h1 style={{ position: 'absolute', bottom: 20, left: 24, color: '#fff', fontSize: 28, fontWeight: 900, margin: 0 }}>{rifa.name}</h1>
            </div>
          )}
          <div style={{ padding: '24px 28px' }}>
            {!displayImage && <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--dark)', marginBottom: 8 }}>{rifa.name}</h1>}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: `${brandPrimary}12`, color: brandPrimary, borderRadius: 6, padding: '7px 10px', fontSize: 12, fontWeight: 700, marginBottom: 18 }}>
              <i className={`fas ${category.icon}`} />{category.label}
            </div>
            
            {gallery.length > 1 && (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 20, paddingBottom: 8 }} className="custom-scrollbar">
                {gallery.map((url, idx) => (
                  <button key={idx} onClick={() => setActiveImage(url)} style={{ width: 70, height: 70, flexShrink: 0, borderRadius: 12, overflow: 'hidden', border: activeImage === url || (!activeImage && idx===0) ? `3px solid ${C.primary}` : '3px solid transparent', padding: 0, cursor: 'pointer', transition: 'all 0.2s', opacity: activeImage === url || (!activeImage && idx===0) ? 1 : 0.6 }}>
                    <img src={url} alt={`thumb-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}

            {rifa.description && <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 20 }}>{rifa.description}</p>}

            {/* Premios */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              {[{ label: '🥇 1er Premio', val: rifa.prize1 }, { label: '🥈 2do Premio', val: rifa.prize2 }, { label: '🥉 3er Premio', val: rifa.prize3 }]
                .filter(p => p.val)
                .map((p, i) => (
                  <div key={i} style={{ background: 'var(--bg-alt)', borderRadius: 10, padding: '8px 16px', fontSize: 14 }}>
                    <span style={{ fontWeight: 700, color: 'var(--dark)' }}>{p.label}:</span>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{p.val}</span>
                  </div>
                ))
              }
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.primary }}>{fmt(rifa.price)} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>por ticket</span></div>
              {rifa.sorteo_date && <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}><i className="fas fa-calendar" style={{ marginRight: 6, color: C.primary }} />Sorteo: {new Date(rifa.sorteo_date).toLocaleDateString('es-DO', { dateStyle: 'long' })}</div>}
            </div>

            {/* Barra de progreso */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{sold} pagados · {reserved} reservados · {rifa.total - sold - reserved} disponibles</span>
                <span style={{ fontWeight: 700, color: C.primary }}>{pct}% vendido</span>
              </div>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: C.gradient, borderRadius: 4 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { color: 'var(--card)', border: '1.5px solid var(--border)', label: 'Disponible' },
            { color: C.primary, border: 'none', label: 'Seleccionado', textColor: '#fff' },
            { color: 'rgba(255,193,7,0.2)', border: '1.5px solid #ffc107', label: 'Reservado' },
            { color: 'rgba(0,200,83,0.2)', border: '1.5px solid #00c853', label: 'Pagado' },
          ].map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: l.color, border: l.border }} />
              {l.label}
            </div>
          ))}
        </div>

        {/* Grid de números */}
        <div style={{ background: 'var(--card)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow)', marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }} className="ticket-numbers">
            {Array.from({ length: rifa.total }, (_, i) => i + 1).map(n => {
              const status = tickets[n]
              const isSel  = selected.includes(n)
              const isPaid = status === 'paid'
              const isRes  = status === 'reserved'
              return (
                <button key={n} onClick={() => toggleNum(n)} disabled={isPaid || isRes}
                  style={{
                    padding: '8px 4px', borderRadius: 6, border: isSel ? 'none' : (isPaid ? '1.5px solid #00c853' : isRes ? '1.5px solid #ffc107' : '1.5px solid var(--border)'),
                    background: isSel ? C.primary : isPaid ? 'rgba(0,200,83,0.2)' : isRes ? 'rgba(255,193,7,0.2)' : 'var(--card)',
                    color: isSel ? '#fff' : isPaid ? C.success : isRes ? '#ffc107' : 'var(--dark)',
                    fontSize: 11, fontWeight: 600, cursor: isPaid || isRes ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}>
                  {String(n).padStart(4, '0')}
                </button>
              )
            })}
          </div>
        </div>

        {/* Barra flotante de selección */}
        {selected.length > 0 && (
          <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1a1a2e', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.4)', zIndex: 100, whiteSpace: 'nowrap' }}>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{selected.length} número{selected.length !== 1 ? 's' : ''} · </span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{fmt(selected.length * rifa.price)}</span>
            </div>
            <button onClick={() => setStep('form')} className="btn-primary"
              style={{ padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Apartar ahora →
            </button>
            {isAdmin && (
              <button onClick={handleAdminBlock} disabled={submitting}
                style={{ padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', background: C.success, color: '#fff' }}>
                <i className="fas fa-shield-halved" style={{ marginRight: 8 }} />Bloquear (Admin)
              </button>
            )}
            <button onClick={() => setSelected([])} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>
        )}
      </div>
    </section>
  )
}
