import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wheel } from 'spin-wheel'
import { C, PLANS, RIFA_CATEGORIES } from '../constants'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import CuadreIA from '../components/CuadreIA'
import Confetti from '../components/Confetti'
import WhiteLabelSettings from '../components/WhiteLabelSettings'

const fmt = (n) => `RD$${Number(n).toLocaleString()}`

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, profile }) {
  const tabs = [
    { id: 'overview',  label: 'General',   icon: 'fa-chart-pie'   },
    { id: 'rifas',     label: 'Mis Rifas', icon: 'fa-ticket'      },
    { id: 'cuadre',    label: 'Cuadre IA', icon: 'fa-scale-balanced' },
    { id: 'referrals', label: 'Referidos', icon: 'fa-users'       },
    { id: 'payments',  label: 'Métodos de Pago', icon: 'fa-credit-card' },
    { id: 'create',    label: 'Crear',     icon: 'fa-plus-circle' },
    { id: 'myplan',    label: 'Mi Plan',   icon: 'fa-star'        },
    { id: 'brand',     label: 'Mi Marca',   icon: 'fa-palette'     },
    { id: 'settings',  label: 'Ajustes',   icon: 'fa-cog'         },
  ]
  const initial = (profile?.name || 'U')[0].toUpperCase()
  const brandName = profile?.brand_name || profile?.name || 'Mi panel'
  const brandLogo = profile?.brand_logo_url || profile?.avatar_url
  const brandColor = profile?.brand_primary_color || C.primary
  return (
    <aside className="dashboard-sidebar" style={{ width: 260, background: '#1a1a2e', minHeight: 'calc(100vh - 80px)', padding: '32px 0', flexShrink: 0 }}>
      <div style={{ padding: '0 20px', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, color: '#fff', fontWeight: 800, fontSize: 17 }}>
          {brandLogo
            ? <img src={brandLogo} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} />
            : <div style={{ width: 34, height: 34, borderRadius: 8, background: brandColor, display: 'grid', placeItems: 'center' }}>{initial}</div>}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brandName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18 }}>{initial}</div>
          <div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{profile?.name || 'Usuario'}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Plan {profile?.plan === 'pro' ? 'Pro ✓' : 'Gratis'}</div>
          </div>
        </div>
      </div>
      {tabs.map(t => (
        <div key={t.id} onClick={() => setActive(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 24px', cursor: 'pointer', background: active === t.id ? 'rgba(217,11,36,0.15)' : 'transparent', borderLeft: active === t.id ? `3px solid ${C.primary}` : '3px solid transparent', color: active === t.id ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s', fontSize: 14, fontWeight: active === t.id ? 600 : 400 }}>
          <i className={`fas ${t.icon}`} style={{ width: 20, textAlign: 'center' }} /> {t.label}
        </div>
      ))}
    </aside>
  )
}

// ── Overview ──────────────────────────────────────────────────────────────────
function Overview({ rifas, setActive, profile }) {
  const navigate     = useNavigate()
  const totalRevenue = rifas.reduce((s, r) => s + r.sold * r.price, 0)
  const totalSold    = rifas.reduce((s, r) => s + r.sold, 0)
  const kpis = [
    { label: 'Ingresos Totales',  value: fmt(totalRevenue),                          icon: 'fa-dollar-sign', color: C.success,   bg: 'rgba(0,200,83,0.1)'    },
    { label: 'Tickets Vendidos',  value: totalSold.toLocaleString(),                  icon: 'fa-ticket',      color: C.primary,   bg: 'rgba(217,11,36,0.1)'  },
    { label: 'Rifas Activas',     value: rifas.filter(r => r.status === 'active').length, icon: 'fa-fire',   color: C.secondary, bg: 'rgba(0,75,204,0.1)' },
    { label: 'Referidos Totales', value: '—',                                         icon: 'fa-users',       color: C.accent,    bg: 'rgba(255,179,0,0.1)'   },
  ]
  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)', marginBottom: 6 }}>Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Bienvenido, {profile?.name || 'Usuario'}. Aquí está el resumen de tus rifas.</p>
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 28 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: 'var(--card)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{k.label}</span>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`fas ${k.icon}`} style={{ color: k.color }} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)' }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--card)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--dark)' }}>Rifas Recientes</h3>
          <button onClick={() => setActive('create')} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, borderRadius: 10 }}>
            <i className="fas fa-plus" style={{ marginRight: 6 }} />Nueva Rifa
          </button>
        </div>
        {rifas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            <i className="fas fa-ticket" style={{ fontSize: 40, marginBottom: 12, display: 'block', opacity: 0.3 }} />
            No tienes rifas aún. <span onClick={() => setActive('create')} style={{ color: C.primary, cursor: 'pointer', fontWeight: 600 }}>Crea tu primera rifa →</span>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Rifa', 'Progreso', 'Vendidos', 'Ingresos', 'Fecha Sorteo', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '10px 8px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rifas.map(r => {
                const pct = Math.round((r.sold / r.total) * 100)
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 8px', fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>{r.name}</td>
                    <td style={{ padding: '14px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? C.success : C.primary, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 8px', fontSize: 14, color: 'var(--dark)' }}>{r.sold}/{r.total}</td>
                    <td style={{ padding: '14px 8px', fontSize: 14, fontWeight: 600, color: C.success }}>{fmt(r.sold * r.price)}</td>
                    <td style={{ padding: '14px 8px', fontSize: 13, color: 'var(--text-secondary)' }}>{r.sorteo_date ? new Date(r.sorteo_date).toLocaleDateString('es-DO') : '—'}</td>
                    <td style={{ padding: '14px 8px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: 50, fontSize: 12, fontWeight: 600, background: r.status === 'active' ? 'rgba(0,200,83,0.1)' : 'rgba(217,11,36,0.1)', color: r.status === 'active' ? C.success : C.primary }}>
                        {r.status === 'active' ? 'Activa' : 'Completada'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      <button onClick={() => navigate(`/rifa/${r.slug}`)}
                        style={{ background: 'none', border: `1px solid ${C.primary}`, color: C.primary, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        <i className="fas fa-eye" style={{ marginRight: 4 }} />Ver
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

// ── My Rifas ──────────────────────────────────────────────────────────────────
function MyRifas({ rifas, setActive, setTicketRifa, setSorteoRifa }) {
  const [copied, setCopied] = useState(null)

  function copyLink(slug) {
    navigator.clipboard.writeText(`${window.location.origin}/rifa/${slug}`)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)', marginBottom: 32 }}>Mis Rifas</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {rifas.map(r => {
          const pct = Math.round((r.sold / r.total) * 100)
          return (
            <div key={r.id} style={{ background: 'var(--card)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
              <div style={{ height: 6, background: r.status === 'active' ? C.gradient : C.success }} />
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>{r.name}</h3>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 5, color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}>
                      <i className={`fas ${RIFA_CATEGORIES.find(c => c.value === (r.category || 'other'))?.icon || 'fa-box-open'}`} />
                      {RIFA_CATEGORIES.find(c => c.value === (r.category || 'other'))?.label || 'Otros'}
                    </span>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 50, fontSize: 11, fontWeight: 600, background: r.status === 'active' ? 'rgba(0,200,83,0.1)' : 'rgba(217,11,36,0.1)', color: r.status === 'active' ? C.success : C.primary, flexShrink: 0, marginLeft: 8 }}>
                    {r.status === 'active' ? 'Activa' : 'Completada'}
                  </span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.sold}/{r.total} vendidos</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.primary }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: C.gradient, borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.success, marginBottom: 16 }}>{fmt(r.sold * r.price)} recaudado</div>

                {/* Botones de acción */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={() => copyLink(r.slug)}
                    style={{ padding: '8px', borderRadius: 8, border: `1px solid ${C.primary}`, background: 'transparent', color: C.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <i className={`fas ${copied === r.slug ? 'fa-check' : 'fa-copy'}`} style={{ marginRight: 4 }} />
                    {copied === r.slug ? 'Copiado' : 'Copiar link'}
                  </button>
                  <button onClick={() => { setTicketRifa(r); setActive('tickets') }}
                    style={{ padding: '8px', borderRadius: 8, border: `1px solid ${C.accent}`, background: 'transparent', color: C.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <i className="fas fa-list" style={{ marginRight: 4 }} />Ver tickets
                  </button>
                  {r.status === 'active' && (
                    <button onClick={() => { setSorteoRifa(r); setActive('sorteo') }}
                      style={{ padding: '8px', borderRadius: 8, border: `1px solid ${C.secondary}`, background: 'transparent', color: C.secondary, fontSize: 12, fontWeight: 600, cursor: 'pointer', gridColumn: 'span 2' }}>
                      <i className="fas fa-shuffle" style={{ marginRight: 4 }} />Realizar Sorteo
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div onClick={() => setActive('create')} style={{ background: 'var(--card)', borderRadius: 20, border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, cursor: 'pointer', transition: 'all 0.2s', minHeight: 200 }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.primary} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(217,11,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <i className="fas fa-plus" style={{ fontSize: 22, color: C.primary }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.primary }}>Nueva Rifa</span>
        </div>
      </div>
    </>
  )
}

// ── Tickets Panel ─────────────────────────────────────────────────────────────
function TicketsPanel({ rifa, setActive }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  const [manualNumber, setManualNumber] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualLoading, setManualLoading] = useState(false)

  useEffect(() => { loadTickets() }, [rifa])

  async function loadTickets() {
    const { data, error } = await supabase.from('tickets').select('*').eq('rifa_id', rifa.id).order('numero')
    if (error) {
      alert('No se pudieron cargar los tickets: ' + error.message)
    }
    setTickets(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    const { error } = await supabase.rpc('set_ticket_status', {
      p_ticket_id: id,
      p_status: status,
    })
    if (error) {
      alert('No se pudo actualizar el ticket: ' + error.message)
      return
    }
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  async function openReceipt(ticket) {
    if (!ticket.receipt_url) return
    const { data, error } = await supabase.storage.from('payment-receipts').createSignedUrl(ticket.receipt_url, 60)
    if (error || !data?.signedUrl) {
      alert('No se pudo abrir el comprobante: ' + (error?.message || 'intenta nuevamente'))
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  async function blockManualTicket() {
    if (!manualNumber || !manualName) return
    setManualLoading(true)
    const num = parseInt(manualNumber)
    if (isNaN(num) || num <= 0 || num > rifa.total) {
      alert(`El número debe estar entre 1 y ${rifa.total}`)
      setManualLoading(false)
      return
    }
    // Verificar si ya está ocupado
    const existing = tickets.find(t => t.numero === num && t.status !== 'cancelled')
    if (existing) {
      alert(`El número ${num} ya está ocupado por ${existing.buyer_name}`)
      setManualLoading(false)
      return
    }
    
    // Insertar
    const { data, error } = await supabase.rpc('admin_block_ticket', {
      p_rifa_id: rifa.id,
      p_number: num,
      p_buyer_name: manualName,
    })

    if (error) {
      alert('Error al bloquear número: ' + error.message)
    } else {
      setTickets(prev => [...prev, data].sort((a,b) => a.numero - b.numero))
      setManualNumber('')
      setManualName('')
    }
    setManualLoading(false)
  }

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)
  const statusColor = { reserved: '#ffc107', paid: C.success, cancelled: C.secondary }
  const statusLabel = { reserved: 'Reservado', paid: 'Pagado', cancelled: 'Cancelado' }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => setActive('rifas')} style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          <i className="fas fa-arrow-left" style={{ marginRight: 6 }} />Volver
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--dark)', margin: 0 }}>Tickets — {rifa.name}</h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', val: tickets.length, color: C.primary },
          { label: 'Pagados', val: tickets.filter(t => t.status === 'paid').length, color: C.success },
          { label: 'Reservados', val: tickets.filter(t => t.status === 'reserved').length, color: '#ffc107' },
          { label: 'Cancelados', val: tickets.filter(t => t.status === 'cancelled').length, color: C.secondary },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--card)', borderRadius: 12, padding: '12px 20px', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
        <div style={{ background: 'var(--card)', borderRadius: 12, padding: '12px 20px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.success }}>{fmt(tickets.filter(t => t.status === 'paid').length * rifa.price)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Recaudado</div>
        </div>
      </div>

      {/* Filtro */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'reserved', 'paid', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: filter === f ? C.primary : 'transparent', color: filter === f ? '#fff' : 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 600 : 400 }}>
            {f === 'all' ? 'Todos' : statusLabel[f]}
          </button>
        ))}
      </div>

      {/* Bloqueo Manual */}
      <div style={{ background: 'var(--card)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)', marginBottom: 20, border: `1px solid ${C.primary}30` }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}><i className="fas fa-lock" style={{ color: C.primary, marginRight: 8 }}/>Bloquear Número Manualmente</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Número (1-{rifa.total})</label>
            <input type="number" value={manualNumber} onChange={e => setManualNumber(e.target.value)} placeholder="Ej: 15" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-alt)', outline: 'none', color: 'var(--dark)' }} />
          </div>
          <div style={{ flex: '2 1 200px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nombre Referencia</label>
            <input type="text" value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Ej: Vendido en efectivo / Amigo Pedro" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-alt)', outline: 'none', color: 'var(--dark)' }} />
          </div>
          <button onClick={blockManualTicket} disabled={manualLoading} className="btn-primary" style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: manualLoading ? 'not-allowed' : 'pointer', opacity: manualLoading ? 0.7 : 1, fontWeight: 600 }}>
            {manualLoading ? 'Bloqueando...' : 'Ocupar y Marcar Pagado'}
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--card)', borderRadius: 16, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><i className="fas fa-spinner fa-spin" style={{ color: C.primary, fontSize: 24 }} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No hay tickets {filter !== 'all' ? statusLabel[filter].toLowerCase() + 's' : ''}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-alt)' }}>
                {['#', 'Nombre', 'WhatsApp', 'Pago', 'Comprobante', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: C.primary }}>#{String(t.numero).padStart(4,'0')}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--dark)' }}>{t.buyer_name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text-secondary)' }}>
                    <a href={`https://wa.me/${t.buyer_phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                      style={{ color: '#25d366', textDecoration: 'none', fontWeight: 600 }}>
                      <i className="fab fa-whatsapp" style={{ marginRight: 4 }} />{t.buyer_phone}
                    </a>
                  </td>
                   <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--dark)' }}>
                    {t.payment_method
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(217,11,36,0.1)', color: C.primary, padding: '3px 10px', borderRadius: 50, fontWeight: 600, fontSize: 12 }}>
                          <i className="fas fa-credit-card" style={{ fontSize: 10 }} />{t.payment_method}
                        </span>
                      : <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>—</span>
                    }
                   </td>
                   <td style={{ padding: '12px 16px' }}>
                     {t.receipt_url ? (
                       <button onClick={() => openReceipt(t)} title="Abrir comprobante" style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', padding: 0, borderRadius: 6, border: `1px solid ${C.primary}`, background: 'transparent', color: C.primary, cursor: 'pointer' }}>
                         <i className="fas fa-receipt" />
                       </button>
                     ) : <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Pendiente</span>}
                   </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 50, fontSize: 12, fontWeight: 600, background: `${statusColor[t.status]}20`, color: statusColor[t.status] }}>
                      {statusLabel[t.status]}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {t.status === 'reserved' && (
                        <button onClick={() => updateStatus(t.id, 'paid')}
                          style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.success}`, background: 'transparent', color: C.success, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          <i className="fas fa-check" style={{ marginRight: 4 }} />Pagado
                        </button>
                      )}
                      {t.status !== 'cancelled' && (
                        <button onClick={() => updateStatus(t.id, 'cancelled')}
                          style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.secondary}`, background: 'transparent', color: C.secondary, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          <i className="fas fa-times" style={{ marginRight: 4 }} />Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

// ── Sorteo ────────────────────────────────────────────────────────────────────
function SorteoPanel({ rifa, setActive, onDone }) {
  const [tickets, setTickets] = useState([])
  const [ganadores, setGanadores] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [done, setDone] = useState(false)
  const [wheelLabel, setWheelLabel] = useState('')
  const wheelContainerRef = useRef(null)
  const wheelRef = useRef(null)

  useEffect(() => {
    supabase.from('tickets').select('numero, buyer_name').eq('rifa_id', rifa.id).eq('status', 'paid')
      .then(({ data }) => setTickets(data || []))
  }, [rifa])

  useEffect(() => {
    if (!wheelContainerRef.current || !tickets.length) return
    const entries = getWheelEntries(tickets)
    const wheel = new Wheel(wheelContainerRef.current, getWheelProps(entries))
    wheelRef.current = wheel
    return () => {
      wheel.remove()
      wheelRef.current = null
    }
  }, [tickets])

  function getWheelEntries(source, winningNumber = null) {
    if (source.length <= 120) return [...source].sort((a, b) => a.numero - b.numero)
    const winner = source.find(ticket => ticket.numero === winningNumber)
    const withoutWinner = source.filter(ticket => ticket.numero !== winningNumber)
    const step = withoutWinner.length / 119
    const sampled = Array.from({ length: 119 }, (_, index) => withoutWinner[Math.floor(index * step)])
    return winner ? [...sampled, winner].sort((a, b) => a.numero - b.numero) : sampled
  }

  function getWheelProps(entries) {
    return {
      items: entries.map(ticket => ({
        label: `#${String(ticket.numero).padStart(4, '0')}`,
        value: ticket.numero,
      })),
      itemBackgroundColors: ['#D90B24', '#00b8d9', '#004BCC', '#ffc107', '#00c853'],
      itemLabelColors: ['#ffffff'],
      itemLabelFont: 'Inter, sans-serif',
      itemLabelFontSizeMax: entries.length > 60 ? 13 : 22,
      itemLabelRadius: 0.88,
      itemLabelRadiusMax: 0.32,
      itemLabelRotation: 90,
      borderColor: '#ffffff',
      borderWidth: 4,
      lineColor: 'rgba(255,255,255,0.7)',
      lineWidth: 1,
      pointerAngle: 0,
      isInteractive: false,
      onCurrentIndexChange: event => {
        const current = entries[event.currentIndex]
        if (current) setWheelLabel(`#${String(current.numero).padStart(4, '0')}`)
      },
    }
  }

  async function doSorteo() {
    if (!tickets.length || !wheelRef.current || spinning) return
    setSpinning(true)

    const { data, error } = await supabase.rpc('draw_rifa', { p_rifa_id: rifa.id })
    if (error) {
      alert('No se pudo completar el sorteo: ' + error.message)
      setSpinning(false)
      return
    }

    const result = Array.isArray(data) ? data[0] : data
    const winnerNumber = Number(result.winner.match(/#(\d+)/)?.[1])
    const entries = getWheelEntries(tickets, winnerNumber)
    const winningIndex = entries.findIndex(ticket => ticket.numero === winnerNumber)
    if (winningIndex < 0) {
      alert('El ganador fue registrado, pero no se pudo representar en la ruleta.')
      setSpinning(false)
      return
    }

    wheelRef.current.items = getWheelProps(entries).items
    await new Promise(resolve => {
      wheelRef.current.onRest = resolve
      wheelRef.current.spinToItem(
        winningIndex,
        8000,
        true,
        8,
        1,
        value => 1 - Math.pow(1 - value, 3),
      )
    })

    setGanadores({
      winner: result.winner,
      prize2: result.prize2,
      prize3: result.prize3,
      draw_hash: result.draw_hash,
    })
    setSpinning(false)
    setDone(true)
    onDone()
  }

  return (
    <>
      <Confetti active={done} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button onClick={() => setActive('rifas')} disabled={spinning} style={{ background: 'none', border: 'none', color: C.primary, cursor: spinning ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}>
          <i className="fas fa-arrow-left" style={{ marginRight: 6 }} />Volver
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--dark)', margin: 0 }}>Sorteo — {rifa.name}</h1>
      </div>

      <div className="raffle-stage">
        <div className="raffle-wheel-shell">
          <div className="raffle-pointer" aria-hidden="true" />
          <div ref={wheelContainerRef} className="raffle-wheel" aria-label={`Ruleta con ${tickets.length} tickets pagados`} />
          <div className="raffle-wheel-center">
            <i className="fas fa-ticket" />
            <span>{wheelLabel || 'LISTA'}</span>
          </div>
        </div>

        {!done ? (
          <div className="raffle-controls">
            <h2>{spinning ? 'La ruleta está girando...' : '¿Listo para sortear?'}</h2>
            <p><strong>{tickets.length} tickets pagados</strong> participan en este sorteo.</p>
            {tickets.length > 120 && <small>La ruleta es una vista visual; Supabase sortea entre los {tickets.length} tickets pagados.</small>}
            {tickets.length === 0 ? (
              <p className="raffle-empty">No hay tickets pagados. Confirma los pagos primero.</p>
            ) : (
              <button onClick={doSorteo} disabled={spinning} className="btn-primary raffle-spin-button">
                <i className={`fas ${spinning ? 'fa-spinner fa-spin' : 'fa-play'}`} />
                {spinning ? 'Girando...' : 'Girar ruleta'}
              </button>
            )}
          </div>
        ) : (
          <div className="raffle-results">
            <i className="fas fa-trophy" />
            <h2>¡Tenemos ganadores!</h2>
            {[
              { place: '1er Premio', name: ganadores.winner, prize: rifa.prize1 },
              ganadores.prize2 && rifa.prize2 && { place: '2do Premio', name: ganadores.prize2, prize: rifa.prize2 },
              ganadores.prize3 && rifa.prize3 && { place: '3er Premio', name: ganadores.prize3, prize: rifa.prize3 },
            ].filter(Boolean).map(g => (
              <div key={g.place} className="raffle-winner">
                <div>{g.place}</div>
                <strong>{g.name}</strong>
                <span>{g.prize}</span>
              </div>
            ))}
            <p className="raffle-hash" title={ganadores.draw_hash}>Huella: {ganadores.draw_hash?.slice(0, 20)}…</p>
            <button onClick={() => setActive('rifas')} className="btn-primary raffle-back-button">Volver a mis rifas</button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Referrals ─────────────────────────────────────────────────────────────────
function Referrals({ profile }) {
  const refLink = `${window.location.origin}/register?ref=${profile?.ref_code || ''}`
  const [copied, setCopied]     = useState(false)
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => { loadReferrals() }, [profile])

  async function loadReferrals() {
    if (!profile?.ref_code) { setLoading(false); return }
    const { data } = await supabase.rpc('list_my_referrals')
    setReferrals(data || [])
    setLoading(false)
  }

  function copy() {
    navigator.clipboard.writeText(refLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const msg = encodeURIComponent(
      `¡Únete a RyffasRD y crea rifas digitales profesionales! 🎫\n` +
      `Regístrate gratis aquí → ${refLink}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>Programa de Referidos</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
        Comparte tu link. Cada persona que se registre con él queda vinculada a tu cuenta.
      </p>

      {/* Stat */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 24, maxWidth: 480 }}>
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)', textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: C.primary }}>{loading ? '—' : referrals.length}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Referidos totales</div>
        </div>
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)', textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: C.success }}>—</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Próximamente: comisiones</div>
        </div>
      </div>

      {/* Link */}
      <div style={{ background: 'var(--card)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow)', marginBottom: 20, maxWidth: 640 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>Tu link de referido</h3>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <input readOnly value={refLink}
            style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text-secondary)', fontSize: 13 }} />
          <button onClick={copy} className="btn-primary"
            style={{ padding: '12px 18px', borderRadius: 10, fontSize: 14, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer' }}>
            <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} style={{ marginRight: 6 }} />{copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <button onClick={shareWhatsApp}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25d366', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <i className="fab fa-whatsapp" style={{ fontSize: 16 }} />Compartir por WhatsApp
        </button>
      </div>

      {/* Lista de referidos */}
      <div style={{ background: 'var(--card)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow)', maxWidth: 640 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 16 }}>Personas referidas</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}><i className="fas fa-spinner fa-spin" style={{ color: C.primary }} /></div>
        ) : referrals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)' }}>
            <i className="fas fa-users" style={{ fontSize: 36, display: 'block', marginBottom: 12, opacity: 0.25 }} />
            Aún no tienes referidos. ¡Comparte tu link!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {referrals.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {(r.name || r.email)[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--dark)' }}>{r.name || 'Usuario'}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>
                  {new Date(r.created_at).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ── Create ────────────────────────────────────────────────────────────────────
function CreateRifa({ setActive, onCreated, user, profile, rifas }) {
  const [form, setForm]       = useState({ name: '', category: '', description: '', prize1: '', prize2: '', prize3: '', price: '', total: '', sorteo_date: '' })
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleImages(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    
    if (imageFiles.length + files.length > 6) {
      alert('Puedes subir un máximo de 6 fotos.')
      return
    }

    setImageFiles(prev => [...prev, ...files])
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  function removeImage(index) {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    
    // Validar plan
    const currentPlanId = profile?.plan || 'demo'
    const plan = PLANS.find(p => p.id === currentPlanId) || PLANS[0]
    const activeRifasCount = rifas.filter(r => r.status === 'active').length
    const reqTotal = parseInt(form.total)

    if (activeRifasCount >= plan.maxRifas) {
      setError(`Tu plan ${plan.label} solo permite ${plan.maxRifas} rifa(s) activa(s). Actualiza tu plan para crear más.`)
      return
    }

    if (reqTotal && reqTotal > plan.maxTickets) {
      setError(`Tu plan ${plan.label} solo permite crear rifas con hasta ${plan.maxTickets.toLocaleString()} tickets.`)
      return
    }

    if (!form.name || !form.category || !form.prize1 || !form.price || !form.total) {
      setError('Completa los campos requeridos: Nombre, Categoría, 1er Premio, Precio y Cantidad')
      return
    }
    setLoading(true)
    try {
      let image_url = null
      let gallery_urls = []

      // Subir imágenes si hay
      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i]
          const ext  = file.name.split('.').pop()
          const path = `rifas/${user.id}/${Date.now()}_${i}.${ext}`
          const { error: uploadErr } = await supabase.storage.from('rifa-images').upload(path, file, { upsert: true })
          if (uploadErr) throw uploadErr
          const { data: urlData } = supabase.storage.from('rifa-images').getPublicUrl(path)
          gallery_urls.push(urlData.publicUrl)
        }
        image_url = gallery_urls[0] // La primera es la principal
      }

      const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()

      const { error: err } = await supabase.from('rifas').insert({
        user_id:     user.id,
        name:        form.name,
        category:    form.category,
        description: form.description || null,
        prize1:      form.prize1,
        prize2:      form.prize2 || null,
        prize3:      form.prize3 || null,
        price:       parseFloat(form.price),
        total:       parseInt(form.total),
        sorteo_date: form.sorteo_date || null,
        image_url,
        gallery_urls,
        slug,
      })
      if (err) throw err
      onCreated()
      setActive('rifas')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const IS = { width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--dark)', fontSize: 14, boxSizing: 'border-box', outline: 'none' }
  const lbl = (text, req) => (
    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>
      {text}{req && <span style={{ color: C.secondary }}> *</span>}
    </label>
  )

  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)', marginBottom: 32 }}>Crear Nueva Rifa</h1>
      <div style={{ background: 'var(--card)', borderRadius: 20, padding: 36, maxWidth: 640, boxShadow: 'var(--shadow)' }}>
        <form onSubmit={handleSubmit} noValidate>

          <div style={{ marginBottom: 20 }}>{lbl('Nombre del Premio', true)}
            <input type="text" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Ej: iPhone 16 Pro Max" style={IS} />
          </div>

          <div style={{ marginBottom: 20 }}>{lbl('Categoría', true)}
            <select value={form.category} onChange={e => setF('category', e.target.value)} style={{ ...IS, cursor: 'pointer' }}>
              <option value="">Selecciona una categoría...</option>
              {RIFA_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>{lbl('Descripción')}
            <textarea value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Describe el premio y condiciones..." rows={3} style={{ ...IS, resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: 20 }}>{lbl('1er Premio', true)}
            <input type="text" value={form.prize1} onChange={e => setF('prize1', e.target.value)} placeholder="Ej: iPhone 16 Pro Max 256GB" style={IS} />
          </div>

          <div style={{ marginBottom: 20 }}>{lbl('2do Premio')}
            <input type="text" value={form.prize2} onChange={e => setF('prize2', e.target.value)} placeholder="Opcional" style={IS} />
          </div>

          <div style={{ marginBottom: 20 }}>{lbl('3er Premio')}
            <input type="text" value={form.prize3} onChange={e => setF('prize3', e.target.value)} placeholder="Opcional" style={IS} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>{lbl('Precio por ticket (RD$)', true)}
              <input type="number" value={form.price} onChange={e => setF('price', e.target.value)} placeholder="150" style={IS} />
            </div>
            <div>{lbl('Cantidad de números', true)}
              <input type="number" value={form.total} onChange={e => setF('total', e.target.value)} placeholder="100" style={IS} />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>{lbl('Fecha del Sorteo')}
            <input type="date" value={form.sorteo_date} onChange={e => setF('sorteo_date', e.target.value)} style={IS} />
          </div>

          {/* Imágenes */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>
              <i className="fas fa-images" style={{ color: C.primary, marginRight: 6 }} />Fotos del Premio (Máximo 6)
            </label>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12, marginBottom: 12 }}>
              {imagePreviews.map((preview, i) => (
                <div key={i} style={{ position: 'relative', height: 100, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={preview} alt={`preview-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {i === 0 && <span style={{ position: 'absolute', top: 4, left: 4, background: C.primary, color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>Principal</span>}
                  <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-times" style={{ fontSize: 12 }} />
                  </button>
                </div>
              ))}
              
              {imageFiles.length < 6 && (
                <label htmlFor="rifa-images" style={{ height: 100, border: '2px dashed var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'border-color 0.2s', background: 'var(--bg-alt)' }}>
                  <i className="fas fa-plus" style={{ fontSize: 20, marginBottom: 4 }} />
                  <span style={{ fontSize: 11 }}>Añadir foto</span>
                </label>
              )}
            </div>
            
            <input id="rifa-images" type="file" multiple accept="image/*" onChange={handleImages} style={{ display: 'none' }} />
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>La primera imagen será la portada. Puedes subir hasta 6 imágenes (PNG, JPG).</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(255,101,101,0.1)', border: '1px solid rgba(255,101,101,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#ff6565', fontSize: 14 }}>
              <i className="fas fa-circle-exclamation" style={{ marginRight: 8 }} />{error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary"
            style={{ width: '100%', padding: '16px', borderRadius: 12, fontSize: 16, fontWeight: 700, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', border: 'none' }}>
            {loading
              ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Creando rifa...</>
              : <><i className="fas fa-rocket" style={{ marginRight: 8 }} />Crear Rifa</>
            }
          </button>
        </form>
      </div>
    </>
  )
}

// ── Payment Methods ───────────────────────────────────────────────────────────
const BANKS_RD = [
  'BANRESERVAS', 'BANCO POPULAR DOMINICANO', 'BANCO BHD LEÓN',
  'SCOTIABANK RD', 'BANCO SANTA CRUZ', 'BANCO CARIBE',
  'BANCO VIMENCA', 'BANCO LAFISE', 'APAP', 'ADEMI',
  'BANCO ADOPEM', 'OTRO',
]

const METHOD_ICON = {
  bank:   { cls: 'fas fa-university',   color: '#1a73e8', bg: 'rgba(26,115,232,0.1)'  },
  paypal: { cls: 'fab fa-paypal',       color: '#003087', bg: 'rgba(0,48,135,0.08)'   },
  custom: { cls: 'fas fa-money-bill-wave', color: '#00c853', bg: 'rgba(0,200,83,0.1)' },
}

function methodSubtitle(m) {
  if (m.type === 'bank' && m.details) {
    const t = { ahorros: 'Ahorros', corriente: 'Corriente', nomina: 'Nómina' }[m.details.account_type] || m.details.account_type
    const ced = m.details.cedula ? ` • Cédula: ${m.details.cedula}` : ''
    return `${t} • ${m.details.account_number} • ${m.details.holder}${ced}`
  }
  if (m.type === 'paypal' && m.details?.email) return m.details.email
  return 'Método personalizado'
}

function PaymentMethods({ user }) {
  const [methods, setMethods]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('bank')
  const [form, setForm] = useState({
    bank: 'BANRESERVAS', account_type: 'ahorros',
    account_number: '', holder: '', cedula: '', paypal_email: '', custom_label: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => { loadMethods() }, [user])

  async function loadMethods() {
    const { data } = await supabase.from('payment_methods').select('*').eq('user_id', user.id).order('created_at')
    setMethods(data || [])
    setLoading(false)
  }

  async function addMethod() {
    setSaving(true); setError('')
    let name, type, details

    if (formType === 'bank') {
      if (!form.account_number.trim() || !form.holder.trim()) {
        setError('Número de cuenta y titular son requeridos'); setSaving(false); return
      }
      name    = form.bank
      type    = 'bank'
      details = { account_type: form.account_type, account_number: form.account_number.trim(), holder: form.holder.trim(), cedula: form.cedula.trim() }
    } else if (formType === 'paypal') {
      if (!form.paypal_email.trim()) {
        setError('Email o link de PayPal es requerido'); setSaving(false); return
      }
      name    = 'PayPal'
      type    = 'paypal'
      details = { email: form.paypal_email.trim() }
    } else {
      if (!form.custom_label.trim()) {
        setError('El nombre del método es requerido'); setSaving(false); return
      }
      name    = form.custom_label.trim().toUpperCase()
      type    = 'custom'
      details = {}
    }

    const { error: err } = await supabase.from('payment_methods').insert({ user_id: user.id, name, type, details })
    if (err) { setError(err.message); setSaving(false); return }
    setShowForm(false)
    setForm({ bank: 'BANRESERVAS', account_type: 'ahorros', account_number: '', holder: '', cedula: '', paypal_email: '', custom_label: '' })
    await loadMethods()
    setSaving(false)
  }

  async function deleteMethod(id) {
    await supabase.from('payment_methods').delete().eq('id', id)
    setMethods(prev => prev.filter(m => m.id !== id))
  }

  const IS = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--dark)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }

  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>Métodos de Pago</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
        Configura cómo recibirás pagos. Tus clientes verán estas opciones al apartar números.
      </p>

      <div style={{ maxWidth: 640 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <i className="fas fa-spinner fa-spin" style={{ color: C.primary, fontSize: 24 }} />
          </div>
        ) : (
          <>
            {/* Lista de métodos activos */}
            {methods.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {methods.map(m => {
                  const mi = METHOD_ICON[m.type] || METHOD_ICON.custom
                  return (
                    <div key={m.id} style={{ background: 'var(--card)', borderRadius: 14, padding: '16px 20px', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: mi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={mi.cls} style={{ color: mi.color, fontSize: 18 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--dark)' }}>{m.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{methodSubtitle(m)}</div>
                      </div>
                      <button onClick={() => deleteMethod(m.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, fontSize: 16 }}>
                        <i className="fas fa-trash-alt" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {methods.length === 0 && !showForm && (
              <div style={{ background: 'var(--card)', borderRadius: 16, padding: '36px 24px', textAlign: 'center', boxShadow: 'var(--shadow)', marginBottom: 20 }}>
                <i className="fas fa-credit-card" style={{ fontSize: 44, color: 'var(--text-secondary)', opacity: 0.25, display: 'block', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>Sin métodos de pago configurados</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Agrega uno para que tus clientes sepan cómo pagarte.</p>
              </div>
            )}

            {!showForm && (
              <button onClick={() => setShowForm(true)} className="btn-primary"
                style={{ padding: '12px 24px', borderRadius: 12, fontSize: 15, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-plus" />Agregar método de pago
              </button>
            )}
          </>
        )}

        {/* Formulario de agregar */}
        {showForm && (
          <div style={{ background: 'var(--card)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow)', border: '1px solid var(--card-border)' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--dark)', marginBottom: 20 }}>Nuevo método de pago</h3>

            {/* Selector de tipo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 24 }}>
              {[
                { id: 'bank',   label: 'Banco / Transferencia', cls: 'fas fa-university'    },
                { id: 'paypal', label: 'PayPal',                cls: 'fab fa-paypal'         },
                { id: 'custom', label: 'Otro (Zelle, etc.)',    cls: 'fas fa-money-bill-wave'},
              ].map(t => (
                <button key={t.id} onClick={() => setFormType(t.id)}
                  style={{ padding: '12px 8px', borderRadius: 10, border: `2px solid ${formType === t.id ? C.primary : 'var(--border)'}`, background: formType === t.id ? 'rgba(217,11,36,0.08)' : 'var(--bg-alt)', color: formType === t.id ? C.primary : 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: formType === t.id ? 700 : 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <i className={t.cls} style={{ fontSize: 20 }} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Campos según tipo */}
            {formType === 'bank' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>Banco *</label>
                  <select value={form.bank} onChange={e => setForm(p => ({ ...p, bank: e.target.value }))} style={IS}>
                    {BANKS_RD.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>Tipo de cuenta *</label>
                  <select value={form.account_type} onChange={e => setForm(p => ({ ...p, account_type: e.target.value }))} style={IS}>
                    <option value="ahorros">Cuenta de Ahorros</option>
                    <option value="corriente">Cuenta Corriente</option>
                    <option value="nomina">Cuenta Nómina</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>Número de cuenta *</label>
                  <input type="text" value={form.account_number}
                    onChange={e => setForm(p => ({ ...p, account_number: e.target.value }))}
                    placeholder="Ej: 1234567890" style={IS} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>Titular de la cuenta *</label>
                  <input type="text" value={form.holder}
                    onChange={e => setForm(p => ({ ...p, holder: e.target.value }))}
                    placeholder="Nombre completo del titular" style={IS} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>Cédula del titular <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(opcional)</span></label>
                  <input type="text" value={form.cedula}
                    onChange={e => setForm(p => ({ ...p, cedula: e.target.value }))}
                    placeholder="Ej: 001-1234567-8" style={IS} />
                </div>
              </div>
            )}

            {formType === 'paypal' && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>Email o link de PayPal *</label>
                <input type="text" value={form.paypal_email}
                  onChange={e => setForm(p => ({ ...p, paypal_email: e.target.value }))}
                  placeholder="tu@email.com  ó  paypal.me/tulink" style={IS} />
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
                  El participante enviará el pago a esta dirección de PayPal.
                </p>
              </div>
            )}

            {formType === 'custom' && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>Nombre del método *</label>
                <input type="text" value={form.custom_label}
                  onChange={e => setForm(p => ({ ...p, custom_label: e.target.value }))}
                  placeholder="Ej: ZELLE, WESTERN UNION, EFECTIVO" style={IS} />
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(255,101,101,0.1)', border: '1px solid rgba(255,101,101,0.3)', borderRadius: 10, padding: '10px 14px', marginTop: 16, color: '#ff6565', fontSize: 14 }}>
                <i className="fas fa-circle-exclamation" style={{ marginRight: 8 }} />{error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={addMethod} disabled={saving} className="btn-primary"
                style={{ flex: 1, padding: '12px', borderRadius: 10, fontSize: 14, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving
                  ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }} />Guardando...</>
                  : <><i className="fas fa-check" style={{ marginRight: 6 }} />Guardar</>}
              </button>
              <button onClick={() => { setShowForm(false); setError('') }}
                style={{ padding: '12px 20px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14 }}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Settings ──────────────────────────────────────────────────────────────────
function Settings({ profile }) {
  const { user } = useAuth()
  const [name, setName]   = useState(profile?.name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [avatar, setAvatar] = useState(profile?.avatar_url || '')
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}/${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('rifa-images').upload(path, file, { upsert: true })
    if (uploadErr) {
      alert('Error subiendo imagen')
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from('rifa-images').getPublicUrl(path)
    setAvatar(urlData.publicUrl)
    setUploading(false)
  }

  async function handleSave() {
    await supabase.from('profiles').update({ name, phone, avatar_url: avatar }).eq('id', profile.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)', marginBottom: 32 }}>Ajustes y Marca</h1>
      <div style={{ background: 'var(--card)', borderRadius: 20, padding: 36, maxWidth: 640, boxShadow: 'var(--shadow)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--dark)' }}>Perfil del Organizador</h3>
        
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-alt)', border: '2px dashed var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {uploading ? <i className="fas fa-spinner fa-spin" style={{ color: 'var(--text-secondary)' }} /> : 
             avatar ? <img src={avatar} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 
             <i className="fas fa-camera" style={{ color: 'var(--text-secondary)', fontSize: 24 }} />}
          </div>
          <div>
            <label htmlFor="avatar-upload" style={{ cursor: 'pointer', display: 'inline-block', padding: '8px 16px', borderRadius: 8, background: 'var(--bg-alt)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--dark)', marginBottom: 6 }}>
              <i className="fas fa-upload" style={{ marginRight: 6 }}/> Subir Logo
            </label>
            <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} disabled={uploading} />
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>JPG, PNG (Max 2MB)</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>Nombre o Marca</label>
          <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--dark)', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>Email</label>
          <input readOnly value={profile?.email || ''} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text-secondary)', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>WhatsApp</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 809 000 0000" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--dark)', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <button onClick={handleSave} disabled={uploading} className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 15, cursor: uploading ? 'not-allowed' : 'pointer', border: 'none' }}>
          {saved ? <><i className="fas fa-check" style={{ marginRight: 8 }} />Guardado</> : 'Guardar Cambios'}
        </button>
      </div>
    </>
  )
}
function MyPlanPanel({ profile }) {
  const currentPlanId = profile?.plan || 'demo'
  const currentPlan = PLANS.find(p => p.id === currentPlanId) || PLANS[0]

  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>Mi Plan y Facturación</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Gestiona tu suscripción y aumenta tus límites de ventas.</p>
      
      <div style={{ background: 'var(--card)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow)', marginBottom: 40, border: `1px solid ${C.primary}40`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: C.gradient }} />
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Plan actual</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--dark)' }}>{currentPlan.label}</div>
          {currentPlanId === 'demo' && <span style={{ background: 'rgba(0,75,204,0.1)', color: C.secondary, padding: '6px 12px', borderRadius: 50, fontSize: 13, fontWeight: 700 }}>Prueba de 7 días</span>}
        </div>
        <div style={{ display: 'flex', gap: 24, color: 'var(--text-secondary)', fontSize: 15 }}>
          <span><i className="fas fa-fire" style={{ color: C.primary, marginRight: 6 }} /> {currentPlan.maxRifas} rifa(s) activas</span>
          <span><i className="fas fa-ticket" style={{ color: C.primary, marginRight: 6 }} /> Hasta {currentPlan.maxTickets === 999999 ? 'ilimitados' : currentPlan.maxTickets.toLocaleString()} tickets por rifa</span>
        </div>
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 20 }}>Mejorar tu Plan</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {PLANS.filter(p => p.id !== 'demo').map(plan => (
           <div key={plan.id} style={{ background: 'var(--card)', borderRadius: 24, padding: 32, boxShadow: 'var(--shadow)', border: currentPlanId === plan.id ? `2px solid ${C.success}` : '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
             <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)' }}>{plan.label}</h3>
             <div style={{ fontSize: 36, fontWeight: 900, color: C.primary, margin: '16px 0 8px' }}>RD${plan.price.toLocaleString()}</div>
             <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>{plan.period}</p>
             
             <ul style={{ padding: 0, margin: '0 0 32px 0', listStyle: 'none', color: 'var(--text-secondary)', fontSize: 14, flex: 1 }}>
               {plan.features.slice(0, 5).map(f => (
                 <li key={f} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                   <i className="fas fa-check-circle" style={{ color: C.success }} /> {f}
                 </li>
               ))}
             </ul>
             
             {currentPlanId === plan.id ? (
               <div style={{ background: 'rgba(0,200,83,0.1)', color: C.success, padding: '14px', textAlign: 'center', borderRadius: 12, fontWeight: 700, fontSize: 15 }}>
                 <i className="fas fa-check" style={{ marginRight: 8 }} /> Plan Activo
               </div>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button className="btn-primary" onClick={() => {
                    if (plan.stripeLink && plan.stripeLink.includes('buy.stripe.com')) {
                      window.open(plan.stripeLink, '_blank')
                    } else {
                      alert('Debes configurar tu enlace de pago de Stripe en src/constants/index.js')
                    }
                  }} style={{ padding: '14px', borderRadius: 12, width: '100%', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
                    <i className="fab fa-stripe" style={{ marginRight: 8, fontSize: 18 }} /> Pagar con Tarjeta
                  </button>
                 <a href={`https://wa.me/18099074452?text=Hola,%20quiero%20pagar%20el%20plan%20${plan.label}%20por%20transferencia.%20Mi%20email%20es:%20${profile?.email}`} target="_blank" rel="noreferrer" style={{ background: '#25d366', color: '#fff', padding: '14px', borderRadius: 12, width: '100%', fontWeight: 700, fontSize: 15, textDecoration: 'none', textAlign: 'center', display: 'block' }}>
                   <i className="fab fa-whatsapp" style={{ marginRight: 8, fontSize: 18 }} /> Transferencia y WhatsApp
                 </a>
               </div>
             )}
           </div>
        ))}
      </div>
    </>
  )
}


// ── Bottom Nav ────────────────────────────────────────────────────────────────
function BottomNav({ active, setActive }) {
  const tabs = [
    { id: 'overview',  label: 'General',  icon: 'fa-chart-pie'   },
    { id: 'rifas',     label: 'Rifas',    icon: 'fa-ticket'      },
    { id: 'payments',  label: 'Pagos',    icon: 'fa-credit-card' },
    { id: 'create',    label: 'Crear',    icon: 'fa-plus-circle' },
    { id: 'settings',  label: 'Ajustes',  icon: 'fa-cog'         },
  ]
  return (
    <nav className="dashboard-bottom-nav" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1a1a2e', borderTop: '1px solid rgba(255,255,255,0.08)', zIndex: 500, justifyContent: 'space-around', padding: '8px 0', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setActive(t.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', color: active === t.id ? C.primary : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: active === t.id ? 700 : 400 }}>
          <i className={`fas ${t.icon}`} style={{ fontSize: 18 }} />{t.label}
        </button>
      ))}
    </nav>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [active, setActive]       = useState('overview')
  const [rifas, setRifas]         = useState([])
  const [ticketRifa, setTicketRifa] = useState(null)
  const [sorteoRifa, setSorteoRifa] = useState(null)

  async function loadRifas() {
    if (!user) return
    const { data } = await supabase.from('rifas').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setRifas(data || [])
  }

  useEffect(() => { loadRifas() }, [user])

  return (
    <section style={{ paddingTop: 80, minHeight: '100vh', background: 'var(--bg-alt)', paddingBottom: 70 }} className="page-enter">
      <div style={{ display: 'flex' }}>
        <Sidebar active={active} setActive={setActive} profile={profile} />
        <main className="dashboard-main" style={{ flex: 1, padding: 32, overflow: 'auto' }}>
          {active === 'overview'  && <Overview  rifas={rifas} setActive={setActive} profile={profile} />}
          {active === 'rifas'     && <MyRifas   rifas={rifas} setActive={setActive} setTicketRifa={setTicketRifa} setSorteoRifa={setSorteoRifa} />}
          {active === 'tickets'   && ticketRifa && <TicketsPanel rifa={ticketRifa} setActive={setActive} />}
          {active === 'sorteo'    && sorteoRifa && <SorteoPanel  rifa={sorteoRifa} setActive={setActive} onDone={loadRifas} />}
          {active === 'cuadre'    && <CuadreIA user={user} rifas={rifas} />}
          {active === 'referrals' && <Referrals profile={profile} />}
          {active === 'payments'  && <PaymentMethods user={user} />}
          {active === 'create'    && <CreateRifa setActive={setActive} onCreated={loadRifas} user={user} profile={profile} rifas={rifas} />}
          {active === 'myplan'    && <MyPlanPanel profile={profile} />}
          {active === 'brand'     && <WhiteLabelSettings profile={profile} />}
          {active === 'settings'  && <Settings  profile={profile} />}
        </main>
      </div>
      <BottomNav active={active} setActive={setActive} />
    </section>
  )
}
