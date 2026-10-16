import { useNavigate } from 'react-router-dom'
import { C, PLANS } from '../constants'
import { useInView, useSEO } from '../hooks'

export default function PricingPage() {
  useSEO({
    title: 'Precios — Desde RD$0 Gratis',
    description: 'Planes de rifas digitales desde RD$0. Sin mensualidades, pago único. Prueba gratis.',
  })
  const navigate = useNavigate()
  const [ref, visible] = useInView()

  return (
    <section ref={ref} style={{ paddingTop: 120, minHeight: '100vh', paddingBottom: 80 }} className="page-enter">
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48, opacity: visible ? 1 : 0, animation: visible ? 'fadeInUp 0.6s ease-out' : 'none' }}>
          <span style={{ display: 'inline-block', background: 'rgba(217,11,36,0.1)', color: C.primary, padding: '6px 18px', borderRadius: 50, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Precios</span>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: 'var(--dark)', marginBottom: 16 }}>
            Elige tu plan y <span style={{ background: C.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>empieza hoy</span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)' }}>Sin complicaciones. El sistema se adapta a ti.</p>
        </div>

        {/* Planes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 48 }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{ position: 'relative', background: plan.featured ? C.gradient : 'var(--card)', color: plan.featured ? '#fff' : 'var(--dark)', borderRadius: 28, padding: 36, boxShadow: plan.featured ? '0 25px 70px rgba(217,11,36,.35)' : 'var(--shadow)', transform: plan.featured ? 'translateY(-14px)' : 'none', border: plan.featured ? 'none' : '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontSize: 24, fontWeight: 800 }}>{plan.label}</h3>
                {plan.featured && <span style={{ background: 'rgba(255,255,255,.22)', color: '#fff', borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 900 }}>Recomendado</span>}
                {!plan.featured && plan.id === 'demo' && <span style={{ background: 'rgba(217,11,36,.08)', color: C.primary, borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 900 }}>Para probar</span>}
              </div>
              <div style={{ fontSize: 44, fontWeight: 950, marginBottom: 4, color: plan.featured ? '#fff' : C.primary }}>
                {plan.price === 0 ? 'RD$0' : `RD$${plan.price.toLocaleString()}`}
              </div>
              <p style={{ opacity: .74, marginBottom: 24, color: plan.featured ? '#fff' : 'var(--text-secondary)' }}>{plan.period}</p>
              
              <ul style={{ padding: 0, margin: '0 0 32px 0', listStyle: 'none', fontSize: 15, flex: 1 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, color: plan.featured ? '#fff' : 'var(--text-secondary)' }}>
                    <i className="fas fa-check-circle" style={{ color: plan.featured ? '#fff' : C.success }} /> <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate(plan.id === 'demo' ? '/dashboard' : '/register')} className={plan.featured ? 'btn-outline' : 'btn-primary'} style={{ width: '100%', padding: '16px', borderRadius: 14, fontSize: 16, fontWeight: 800, background: plan.featured ? '#fff' : C.primary, color: plan.featured ? C.primary : '#fff', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                {plan.id === 'demo' ? 'Probar demo' : `Comprar ${plan.label}`}
              </button>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {[
            { icon: 'fa-lock', text: 'Pago seguro' },
            { icon: 'fa-rotate-left', text: 'Sin mensualidades ocultas' },
            { icon: 'fa-headset', text: 'Soporte 24/7' },
            { icon: 'fa-shield-halved', text: '100% confiable' },
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600 }}>
              <i className={`fas ${b.icon}`} style={{ color: C.primary }} /> {b.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

