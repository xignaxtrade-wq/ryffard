import { useState, useEffect } from 'react'
import { C } from '../constants'
import { supabase } from '../lib/supabase'

const fmt = (n) => `RD$${Number(n).toLocaleString()}`

// Calcula el cuadre completo a partir de las rifas y sus tickets
export function computeCuadre(rifas, tickets) {
  const now = new Date()
  const byRifa = rifas.map((r) => {
    const ts = tickets.filter((t) => t.rifa_id === r.id)
    const paid = ts.filter((t) => t.status === 'paid')
    const reserved = ts.filter((t) => t.status === 'reserved')
    const expired = reserved.filter((t) => t.expires_at && new Date(t.expires_at) < now)
    const cancelled = ts.filter((t) => t.status === 'cancelled')
    return {
      id: r.id,
      nombre: r.name,
      estado: r.status,
      precio_ticket: Number(r.price),
      total_numeros: r.total,
      vendidos_registrados: r.sold,
      pagados: paid.length,
      reservados: reserved.length,
      reservas_vencidas: expired.length,
      cancelados: cancelled.length,
      recaudado_confirmado: paid.length * Number(r.price),
      pendiente_por_confirmar: reserved.length * Number(r.price),
      pagados_sin_metodo: paid.filter((t) => !t.payment_method).length,
    }
  })

  // Cuadre por método de pago (solo tickets pagados)
  const porMetodo = {}
  for (const t of tickets) {
    if (t.status !== 'paid') continue
    const rifa = rifas.find((r) => r.id === t.rifa_id)
    if (!rifa) continue
    const metodo = t.payment_method || 'Sin método registrado'
    if (!porMetodo[metodo]) porMetodo[metodo] = { tickets: 0, monto: 0 }
    porMetodo[metodo].tickets += 1
    porMetodo[metodo].monto += Number(rifa.price)
  }

  // Discrepancias detectadas por reglas
  const discrepancias = []
  for (const r of byRifa) {
    if (r.vendidos_registrados !== r.pagados) {
      discrepancias.push({
        rifa: r.nombre,
        tipo: 'contador_desincronizado',
        detalle: `El contador de vendidos (${r.vendidos_registrados}) no coincide con los tickets pagados reales (${r.pagados}). Diferencia de ${fmt(Math.abs(r.vendidos_registrados - r.pagados) * r.precio_ticket)}.`,
      })
    }
    if (r.reservas_vencidas > 0) {
      discrepancias.push({
        rifa: r.nombre,
        tipo: 'reservas_vencidas',
        detalle: `${r.reservas_vencidas} reserva(s) vencida(s) siguen ocupando números (${fmt(r.reservas_vencidas * r.precio_ticket)} bloqueados).`,
      })
    }
    if (r.pagados_sin_metodo > 0) {
      discrepancias.push({
        rifa: r.nombre,
        tipo: 'pago_sin_metodo',
        detalle: `${r.pagados_sin_metodo} ticket(s) marcados como pagados sin método de pago registrado (${fmt(r.pagados_sin_metodo * r.precio_ticket)} sin trazabilidad).`,
      })
    }
  }

  const totales = {
    recaudado_confirmado: byRifa.reduce((s, r) => s + r.recaudado_confirmado, 0),
    pendiente_por_confirmar: byRifa.reduce((s, r) => s + r.pendiente_por_confirmar, 0),
    tickets_pagados: byRifa.reduce((s, r) => s + r.pagados, 0),
    tickets_reservados: byRifa.reduce((s, r) => s + r.reservados, 0),
    tickets_cancelados: byRifa.reduce((s, r) => s + r.cancelados, 0),
  }

  return { totales, rifas: byRifa, por_metodo: porMetodo, discrepancias }
}

export default function CuadreIA({ user, rifas }) {
  const [tickets, setTickets] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  useEffect(() => { loadTickets() }, [user, rifas])

  async function loadTickets() {
    if (!rifas.length) { setTickets([]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('tickets')
      .select('id, rifa_id, numero, status, payment_method, expires_at')
      .in('rifa_id', rifas.map((r) => r.id))
    setTickets(data || [])
    setLoading(false)
  }

  const cuadre = tickets ? computeCuadre(rifas, tickets) : null

  async function generarAnalisis() {
    if (!cuadre) return
    setAiLoading(true)
    setAiError('')
    setAnalysis('')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('Tu sesión venció. Inicia sesión nuevamente.')
      const res = await fetch('/api/cuadre', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ cuadre }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error del servidor')
      setAnalysis(data.analysis)
    } catch (err) {
      setAiError(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><i className="fas fa-spinner fa-spin" style={{ color: C.primary, fontSize: 24 }} /></div>
  }

  if (!rifas.length) {
    return (
      <>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>Cuadre IA</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Crea tu primera rifa para generar un cuadre.</p>
      </>
    )
  }

  const kpis = [
    { label: 'Recaudado Confirmado', value: fmt(cuadre.totales.recaudado_confirmado), color: C.success },
    { label: 'Pendiente (reservado)', value: fmt(cuadre.totales.pendiente_por_confirmar), color: '#ffc107' },
    { label: 'Tickets Pagados', value: cuadre.totales.tickets_pagados, color: C.primary },
    { label: 'Discrepancias', value: cuadre.discrepancias.length, color: cuadre.discrepancias.length ? C.secondary : C.success },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)', margin: 0 }}>Cuadre IA</h1>
        <button onClick={generarAnalisis} disabled={aiLoading} className="btn-primary"
          style={{ padding: '12px 24px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 14, cursor: aiLoading ? 'not-allowed' : 'pointer', opacity: aiLoading ? 0.7 : 1 }}>
          {aiLoading
            ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Analizando...</>
            : <><i className="fas fa-wand-magic-sparkles" style={{ marginRight: 8 }} />Generar Cuadre con IA</>}
        </button>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
        Cuadre automático de tus rifas: recaudado, pendiente, métodos de pago y discrepancias detectadas.
      </p>

      {/* KPIs */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: 'var(--card)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Análisis IA */}
      {aiError && (
        <div style={{ background: 'rgba(255,101,101,0.1)', border: '1px solid rgba(255,101,101,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, color: '#ff6565', fontSize: 14 }}>
          <i className="fas fa-circle-exclamation" style={{ marginRight: 8 }} />
          No se pudo generar el análisis con IA: {aiError}. El cuadre numérico de abajo sigue siendo válido.
        </div>
      )}
      {analysis && (
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow)', marginBottom: 24, border: `1px solid ${C.primary}40` }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 16 }}>
            <i className="fas fa-robot" style={{ color: C.primary, marginRight: 8 }} />Análisis de la IA
          </h3>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: 'var(--dark)' }}>{analysis}</div>
        </div>
      )}

      {/* Discrepancias */}
      <div style={{ background: 'var(--card)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)', marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 16 }}>
          <i className="fas fa-triangle-exclamation" style={{ color: cuadre.discrepancias.length ? '#ffc107' : C.success, marginRight: 8 }} />
          Discrepancias Detectadas
        </h3>
        {cuadre.discrepancias.length === 0 ? (
          <p style={{ color: C.success, fontSize: 14, margin: 0 }}><i className="fas fa-check-circle" style={{ marginRight: 6 }} />Todo cuadra. No se detectaron discrepancias.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cuadre.discrepancias.map((d, i) => (
              <div key={i} style={{ background: 'var(--bg-alt)', borderRadius: 10, padding: '12px 16px', borderLeft: `3px solid #ffc107`, fontSize: 14, color: 'var(--dark)' }}>
                <strong>{d.rifa}:</strong> {d.detalle}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cuadre por rifa */}
      <div style={{ background: 'var(--card)', borderRadius: 16, boxShadow: 'var(--shadow)', overflow: 'auto', marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', padding: '20px 24px 0' }}>Cuadre por Rifa</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-alt)' }}>
              {['Rifa', 'Pagados', 'Reservados', 'Vencidas', 'Confirmado', 'Pendiente'].map((h) => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cuadre.rifas.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>{r.nombre}</td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: C.success }}>{r.pagados}</td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#ffc107' }}>{r.reservados}</td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: r.reservas_vencidas ? C.secondary : 'var(--text-secondary)' }}>{r.reservas_vencidas}</td>
                <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: C.success }}>{fmt(r.recaudado_confirmado)}</td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text-secondary)' }}>{fmt(r.pendiente_por_confirmar)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cuadre por método de pago */}
      <div style={{ background: 'var(--card)', borderRadius: 16, boxShadow: 'var(--shadow)', overflow: 'auto' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', padding: '20px 24px 0' }}>Cuadre por Método de Pago</h3>
        {Object.keys(cuadre.por_metodo).length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, padding: '12px 24px 24px' }}>Aún no hay tickets pagados.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-alt)' }}>
                {['Método', 'Tickets', 'Monto Confirmado'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(cuadre.por_metodo).map(([metodo, m]) => (
                <tr key={metodo} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: metodo === 'Sin método registrado' ? C.secondary : 'var(--dark)' }}>{metodo}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--dark)' }}>{m.tickets}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: C.success }}>{fmt(m.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
