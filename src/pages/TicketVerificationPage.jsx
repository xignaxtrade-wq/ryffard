import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { C } from '../constants'
import { supabase } from '../lib/supabase'
import { useSEO } from '../hooks'

const STATUS = {
  reserved: { label: 'Apartado pendiente de pago', color: '#d97706', icon: 'fa-clock' },
  paid: { label: 'Pago confirmado', color: '#00a63e', icon: 'fa-circle-check' },
  cancelled: { label: 'Ticket cancelado', color: '#b42318', icon: 'fa-circle-xmark' },
}

export default function TicketVerificationPage() {
  const { code } = useParams()
  const [ticket, setTicket] = useState(null)
  const [qr, setQr] = useState('')
  const [loading, setLoading] = useState(true)

  useSEO({
    title: 'Verificar ticket',
    description: 'Consulta la autenticidad de un ticket de RyffasRD.',
  })

  useEffect(() => {
    async function loadTicket() {
      const { data } = await supabase.rpc('public_ticket_details', { p_ticket_code: code })
      setTicket(data || null)
      setLoading(false)
      if (data?.ticket_code) {
        const image = await QRCode.toDataURL(window.location.href, { width: 220, margin: 1, color: { dark: '#D90B24', light: '#FFFFFF' } })
        setQr(image)
      }
    }
    loadTicket()
  }, [code])

  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><i className="fas fa-spinner fa-spin" style={{ color: C.primary, fontSize: 32 }} /></main>

  if (!ticket) return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ maxWidth: 440, textAlign: 'center' }}>
        <i className="fas fa-ticket-slash" style={{ color: '#b42318', fontSize: 50, marginBottom: 18 }} />
        <h1 style={{ color: 'var(--dark)', fontSize: 26, marginBottom: 10 }}>Ticket no encontrado</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Revisa el código o escanea nuevamente el QR del ticket.</p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-block', padding: '12px 20px', textDecoration: 'none' }}>Ir al inicio</Link>
      </div>
    </main>
  )

  const status = STATUS[ticket.status] || STATUS.cancelled
  const drawDate = ticket.rifa?.sorteo_date ? new Date(ticket.rifa.sorteo_date).toLocaleDateString('es-DO', { dateStyle: 'long' }) : 'Por anunciar'

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-alt)', padding: '112px 24px 60px' }}>
      <section style={{ maxWidth: 620, margin: '0 auto', background: 'var(--card)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
        <div style={{ height: 7, background: C.gradient }} />
        <div style={{ padding: '30px clamp(20px, 5vw, 42px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 26 }}>
            <div>
              <p style={{ marginBottom: 6, color: 'var(--text-secondary)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Ticket digital RyffasRD</p>
              <h1 style={{ color: 'var(--dark)', fontSize: 27, margin: 0 }}>{ticket.rifa?.is_test ? 'Ticket de PRUEBA' : 'Ticket auténtico'}</h1>
            </div>
            {ticket.organizer?.brand_logo_url && <img src={ticket.organizer.brand_logo_url} alt="Logo del organizador" style={{ width: 54, height: 54, borderRadius: 8, objectFit: 'cover' }} />}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 24, alignItems: 'center', padding: 20, borderRadius: 12, background: 'var(--bg-alt)', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>Número participante</div>
              <div style={{ fontSize: 40, lineHeight: 1, color: C.primary, fontWeight: 900 }}>#{String(ticket.number).padStart(4, '0')}</div>
              <div style={{ marginTop: 10, fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{ticket.ticket_code}</div>
            </div>
            {qr && <img src={qr} alt="Código QR de verificación" style={{ width: 110, height: 110, background: '#fff', padding: 4, borderRadius: 6 }} />}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: status.color, fontWeight: 800, marginBottom: 22 }}>
            <i className={`fas ${status.icon}`} />{status.label}
          </div>

          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
            {[
              ['Rifa', ticket.rifa?.name],
              ['Premio principal', ticket.rifa?.prize1],
              ['Organizador', ticket.organizer?.brand_name],
              ['Fecha de sorteo', drawDate],
              ['Comprobante', ticket.receipt_uploaded ? (ticket.status === 'paid' ? 'Recibido - pago confirmado' : ticket.status === 'cancelled' ? 'Recibido - ticket cancelado' : 'Recibido y pendiente de revisión') : 'Aún no cargado'],
            ].map(([label, value]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}><dt style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{label}</dt><dd style={{ margin: 0, textAlign: 'right', color: 'var(--dark)', fontSize: 14, fontWeight: 700 }}>{value || '—'}</dd></div>)}
          </dl>

          {ticket.rifa?.slug && <Link to={`/rifa/${ticket.rifa.slug}`} style={{ display: 'inline-flex', marginTop: 26, color: C.primary, fontWeight: 800, textDecoration: 'none' }}>Ver rifa <i className="fas fa-arrow-right" style={{ marginLeft: 8 }} /></Link>}
        </div>
      </section>
    </main>
  )
}
