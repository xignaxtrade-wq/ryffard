import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { C } from '../constants'
import { useInView, useSEO } from '../hooks'

const PRIZE_META = [
  { label: '1er Premio', icon: 'fa-crown', color: '#ffc107', key: 'winner' },
  { label: '2do Premio', icon: 'fa-medal', color: '#FF6678', key: 'prize2'  },
  { label: '3er Premio', icon: 'fa-award', color: '#FFC400', key: 'prize3'  },
]

export default function HistoryPage() {
  useSEO({
    title: 'Historial de Sorteos',
    description: 'Todos los sorteos realizados en RyffasRD con ganadores verificados y certificados. Transparencia total.',
  })
  const [ref, visible] = useInView()
  const [sorteos, setSorteos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('sorteos').select('*').order('drawn_at', { ascending: false })
      .then(({ data }) => { setSorteos(data || []); setLoading(false) })
  }, [])

  const totalTickets = sorteos.reduce((s, r) => s + (r.total_tickets || 0), 0)

  return (
    <section ref={ref} style={{ paddingTop: 120, minHeight: '100vh', paddingBottom: 80 }} className="page-enter">
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48, opacity: visible ? 1 : 0, animation: visible ? 'fadeInUp 0.6s ease-out' : 'none' }}>
          <span style={{ display: 'inline-block', background: 'rgba(0,200,83,0.1)', color: C.success, padding: '6px 18px', borderRadius: 50, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            <i className="fas fa-circle-check" style={{ marginRight: 6 }} />Transparencia Total
          </span>
          <h1 style={{ fontSize: 44, fontWeight: 900, color: 'var(--dark)', marginBottom: 12 }}>
            Historial de <span style={{ background: C.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sorteos</span>
          </h1>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto' }}>
            Todos los sorteos realizados con sus ganadores verificados. Nada que ocultar.
          </p>
        </div>

        {/* Stats bar */}
        <div className="history-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 48 }}>
          {[
            { icon: 'fa-trophy',       label: 'Sorteos Realizados', value: sorteos.length,                   color: C.warning },
            { icon: 'fa-users',        label: 'Ganadores Totales',  value: sorteos.reduce((n, s) => n + [s.winner, s.prize2, s.prize3].filter(Boolean).length, 0), color: C.primary },
            { icon: 'fa-ticket',       label: 'Tickets Sorteados',  value: totalTickets.toLocaleString(),     color: C.success },
            { icon: 'fa-circle-check', label: 'Huellas registradas', value: sorteos.filter(s => s.draw_hash).length, color: C.accent },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--card)', borderRadius: 16, padding: 20, textAlign: 'center', boxShadow: 'var(--shadow)', opacity: visible ? 1 : 0, animation: visible ? `fadeInUp 0.5s ease-out ${i * 0.1}s both` : 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <i className={`fas ${s.icon}`} style={{ color: s.color }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--dark)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: 32, color: C.primary }} />
          </div>
        ) : sorteos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'var(--card)', borderRadius: 20, boxShadow: 'var(--shadow)' }}>
            <i className="fas fa-trophy" style={{ fontSize: 48, color: 'var(--border)', marginBottom: 16, display: 'block' }} />
            <h3 style={{ color: 'var(--dark)', marginBottom: 8 }}>Aún no hay sorteos registrados</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Los sorteos aparecerán aquí una vez que se realicen.</p>
          </div>
        ) : sorteos.map((sorteo, i) => (
          <div key={sorteo.id} style={{ background: 'var(--card)', borderRadius: 20, padding: 28, marginBottom: 20, boxShadow: 'var(--shadow)', border: '1px solid var(--card-border)', opacity: visible ? 1 : 0, animation: visible ? `fadeInUp 0.6s ease-out ${i * 0.1}s both` : 'none' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)', marginBottom: 6 }}>{sorteo.rifa_name}</h3>
                <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span><i className="fas fa-calendar" style={{ marginRight: 4 }} />{new Date(sorteo.drawn_at).toLocaleDateString('es-DO', { dateStyle: 'long' })}</span>
                  {sorteo.total_tickets && <span><i className="fas fa-ticket" style={{ marginRight: 4 }} />{sorteo.total_tickets.toLocaleString()} tickets</span>}
                </div>
                {sorteo.draw_hash && (
                  <div title={sorteo.draw_hash} style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>
                    Huella: {sorteo.draw_hash.slice(0, 16)}…
                  </div>
                )}
              </div>
              <div style={{ background: 'rgba(0,200,83,0.1)', padding: '6px 14px', borderRadius: 50, fontSize: 12, fontWeight: 700, color: C.success, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fas fa-circle-check" /> Registrado
              </div>
            </div>

            <div className="history-winners" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {PRIZE_META.filter(p => sorteo[p.key]).map((p, j) => (
                <div key={j} style={{ background: 'var(--bg-alt)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${p.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`fas ${p.icon}`} style={{ color: p.color, fontSize: 15 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{p.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>{sorteo[p.key]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
