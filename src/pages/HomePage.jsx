import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, PLANS } from '../constants'
import { useSEO } from '../hooks'

const painPoints = [
  { icon: 'fa-comments', title: 'Caos en WhatsApp', desc: 'Mensajes perdidos, números repetidos, capturas mezcladas y clientes preguntando lo mismo todo el día.' },
  { icon: 'fa-receipt', title: 'Pagos sin verificar', desc: 'Apartados sin control, comprobantes duplicados y números bloqueados sin confirmación real.' },
  { icon: 'fa-chart-line', title: 'Ventas perdidas', desc: 'Si no respondes rápido, el cliente se va. Tu rifa debe vender 24/7 aunque estés ocupado.' },
]

const platformFeatures = [
  'Talonario digital público con números disponibles, apartados y pagados.',
  'Selector manual, búsqueda rápida, número aleatorio y paquetes de tickets.',
  'Métodos de pago configurables con instrucciones claras para el cliente.',
  'Confirmación por WhatsApp con resumen automático del pedido.',
  'Panel administrativo para aprobar pagos, ver ventas y controlar la rifa.',
]

const adminCards = [
  { icon: 'fa-gauge-high', title: 'Centro de mando', desc: 'Ventas, tickets disponibles, ingresos y progreso de cada sorteo en tiempo real.' },
  { icon: 'fa-bullhorn', title: 'Crea campañas', desc: 'Configura premio, precio, fecha, cantidad de tickets, slug y descripción pública.' },
  { icon: 'fa-palette', title: 'Personaliza tu marca', desc: 'Logo, colores, nombre comercial, contacto y apariencia profesional para tu negocio.' },
  { icon: 'fa-circle-check', title: 'Aprueba pagos', desc: 'Marca tickets como pagados o reservados y evita duplicados con control centralizado.' },
  { icon: 'fa-money-bill-transfer', title: 'Recibe tu dinero', desc: 'Transferencia, depósito, PayPal o método manual con instrucciones visibles.' },
  { icon: 'fa-headset', title: 'Soporte y éxito', desc: 'Flujo pensado para que cualquier organizador pueda vender sin complicarse.' },
]



const comparison = [
  ['Dominio personalizado', 'Opcional', 'Incluido'],
  ['Sorteos activos', '1 rifa', 'Ilimitados'],
  ['Límite de tickets', 'Hasta 1,000', 'Hasta 1M'],
  ['Métodos de pago', 'Sí', 'Sí'],
  ['Venta manual / promotores', 'Sí', 'Sí avanzado'],
  ['Correos y WhatsApp', 'WhatsApp', 'WhatsApp + correo'],
  ['Personalización de marca', 'Colores básicos', 'Completa'],
  ['Reportes descargables', 'No', 'PDF y Excel'],
  ['Paquetes/descuentos', 'No', 'Sí'],
  ['Nivel de soporte', 'Estándar', 'Prioritario'],
]

const clients = [
  { name: 'Mundo Premio RD', domain: 'mundopremiord.com', letter: 'M' },
  { name: 'La Bendición Rifa', domain: 'labendicionrifa.com', letter: 'L' },
  { name: 'Rifa Vex', domain: 'rifavex.com', letter: 'R' },
]

const testimonials = [
  { name: 'Cliente activo', brand: 'Rifas Premium RD', text: 'Antes todo era por WhatsApp. Ahora los clientes ven los números disponibles y apartan sin preguntarme.' },
  { name: 'Organizador', brand: 'Sorteo Familiar', text: 'El panel me ayudó a controlar pagos, reservas y ganadores sin hojas de cálculo.' },
  { name: 'Emprendedora', brand: 'Premios del Cibao', text: 'Se ve más profesional y la gente confía más cuando el ticket queda registrado.' },
]

const faqs = [
  ['¿Tengo que pagar mensualidades?', 'No necesariamente. Puedes vender el sistema como pago único, demo o plan anual, dependiendo de tu modelo.'],
  ['¿Cobran comisión por ticket vendido?', 'La idea es que RyffasRD no dependa de comisión por cada ticket. El organizador recibe su dinero directo.'],
  ['¿Cómo se verifican los pagos?', 'El cliente aparta números, envía comprobante por WhatsApp y el administrador aprueba el pago desde el panel.'],
  ['¿Puedo usar mi propio dominio?', 'Sí. La versión comercial puede trabajar con dominio propio para que tu marca se vea más seria.'],
  ['¿Se puede elegir ganador por lotería?', 'Sí. La estructura soporta finalizar por número ganador, sorteo manual o integración futura con resultados.'],
]

const SectionTitle = ({ badge, title, highlight, desc, dark = false }) => (
  <div style={{ textAlign: 'center', maxWidth: 780, margin: '0 auto 54px' }}>
    {badge && <span style={{ display: 'inline-block', background: dark ? 'rgba(255,179,0,.15)' : 'rgba(0,102,255,.08)', color: dark ? '#7dd3fc' : '#0066ff', padding: '8px 18px', borderRadius: 999, fontWeight: 800, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 16 }}>{badge}</span>}
    <h2 style={{ fontSize: 42, lineHeight: 1.12, color: dark ? '#fff' : 'var(--dark)', fontWeight: 950, marginBottom: 16 }}>
      {title} {highlight && <span style={{ background: C.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{highlight}</span>}
    </h2>
    {desc && <p style={{ color: dark ? 'rgba(255,255,255,.72)' : 'var(--text-secondary)', fontSize: 17, lineHeight: 1.7 }}>{desc}</p>}
  </div>
)

function HeroMockup() {
  const sold = [0, 2, 4, 7, 8, 11, 13, 14, 18, 20, 21, 24, 27, 29]
  const reserved = [3, 10, 17, 25]
  return (
    <div style={{ position: 'relative', maxWidth: 390, margin: '0 auto' }}>
      <div className="animate-float" style={{ background: '#0b1220', borderRadius: 34, padding: 14, boxShadow: '0 30px 80px rgba(0,38,100,.25)' }}>
        <div style={{ background: '#fff', borderRadius: 26, overflow: 'hidden' }}>
          <div style={{ background: C.gradient, color: '#fff', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <strong>RyffasRD</strong><span style={{ background: 'rgba(255,255,255,.22)', padding: '5px 10px', borderRadius: 999, fontSize: 12 }}>Activa</span>
            </div>
            <h3 style={{ fontSize: 24, lineHeight: 1.1 }}>iPhone 16 Pro Max</h3>
            <p style={{ opacity: .85, marginTop: 6 }}>RD$150 por número</p>
          </div>
          <div style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}><b>Progreso</b><b style={{ color: C.primary }}>73%</b></div>
            <div style={{ height: 10, background: '#e8edf7', borderRadius: 999, overflow: 'hidden', marginBottom: 16 }}><div style={{ width: '73%', height: '100%', background: C.gradient }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 7 }}>
              {Array.from({ length: 30 }, (_, i) => {
                const bg = sold.includes(i) ? C.primary : reserved.includes(i) ? C.warning : '#f1f5f9'
                const color = sold.includes(i) ? '#fff' : reserved.includes(i) ? '#111827' : '#64748b'
                return <div key={i} style={{ aspectRatio: '1', borderRadius: 9, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{String(i).padStart(3, '0')}</div>
              })}
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: 14, marginTop: 18 }}>Apartar mis números</button>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', top: -18, right: -20, background: C.gradientHot, color: '#fff', padding: '10px 16px', borderRadius: 999, fontWeight: 900, fontSize: 13, boxShadow: '0 12px 30px rgba(0,75,204,.35)' }}><i className="fas fa-fire" /> Vendiendo 24/7</div>
    </div>
  )
}

function Hero() {
  const navigate = useNavigate()
  return (
    <section id="inicio" style={{ minHeight: '100vh', padding: '130px 24px 80px', background: 'radial-gradient(circle at 20% 20%, rgba(0,102,255,.10), transparent 26%), radial-gradient(circle at 80% 0%, rgba(255,179,0,.14), transparent 28%), #f8fbff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(15,23,42,.10) 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: .45 }} />
      <div className="hero-grid" style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 58, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: '#fff', color: '#0066ff', border: '1px solid rgba(0,102,255,.14)', boxShadow: '0 8px 26px rgba(15,23,42,.06)', padding: '9px 16px', borderRadius: 999, fontWeight: 900, fontSize: 13, marginBottom: 22 }}>
            <i className="fas fa-bolt" /> Sistema de Rifas Digitales 3.0
          </div>
          <h1 style={{ fontSize: 62, lineHeight: 1.03, letterSpacing: '-.05em', color: '#081225', fontWeight: 950, marginBottom: 24 }}>
            Crea y gestiona sorteos digitales de forma <span style={{ background: C.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>simple y automatizada</span>
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.75, color: '#475569', maxWidth: 620, marginBottom: 34 }}>
            RyffasRD convierte tus rifas en una plataforma profesional: talonario online, pagos organizados, tickets únicos, WhatsApp integrado y panel administrativo para vender sin desorden.
          </p>
          <div className="hero-btns" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 26 }}>
            <button onClick={() => navigate('/demo')} className="btn-primary" style={{ padding: '17px 30px', fontSize: 15 }}><i className="fas fa-rocket" /> Quiero mi sistema ahora</button>
            <button onClick={() => navigate('/pricing')} className="btn-outline" style={{ padding: '15px 28px', fontSize: 15, background: '#fff' }}><i className="fas fa-book-open" /> Ver planes</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, color: '#64748b', fontSize: 14, fontWeight: 700 }}>
            <span><i className="fas fa-circle-check" style={{ color: C.success }} /> Sin comisiones por ticket</span>
            <span><i className="fas fa-circle-check" style={{ color: C.success }} /> Activación rápida</span>
            <span><i className="fas fa-circle-check" style={{ color: C.success }} /> Listo para móvil</span>
          </div>
        </div>
        <HeroMockup />
      </div>
    </section>
  )
}

function PainSection() {
  return (
    <section id="beneficios" style={{ padding: '95px 24px', background: '#071225', color: '#fff' }}>
      <SectionTitle dark badge="Problema real" title="¿Te suena familiar esta" highlight="pesadilla?" desc="El negocio de rifas se complica cuando todo depende de notas, capturas y mensajes manuales." />
      <div className="features-grid" style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
        {painPoints.map((p) => (
          <div key={p.title} style={{ background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.10)', borderRadius: 24, padding: 30 }}>
            <div style={{ width: 58, height: 58, borderRadius: 18, background: 'rgba(0,75,204,.14)', color: '#ff7d98', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 20 }}><i className={`fas ${p.icon}`} /></div>
            <h3 style={{ fontSize: 22, marginBottom: 12 }}>{p.title}</h3>
            <p style={{ color: 'rgba(255,255,255,.70)', lineHeight: 1.65 }}>{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function PlatformSection() {
  return (
    <section id="plataforma" style={{ padding: '100px 24px', background: '#fff' }}>
      <SectionTitle badge="La plataforma" title="Todos tus sorteos en" highlight="una sola plataforma" desc="Una experiencia clara para el cliente y un control completo para el organizador." />
      <div className="hero-grid" style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
        <div style={{ display: 'grid', gap: 16 }}>
          {platformFeatures.map((f, i) => (
            <div key={f} style={{ display: 'flex', gap: 16, padding: 20, border: '1px solid #e6edf7', borderRadius: 20, boxShadow: '0 10px 30px rgba(15,23,42,.05)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: C.gradient, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 900 }}>{i + 1}</div>
              <p style={{ color: '#475569', lineHeight: 1.55, fontWeight: 650 }}>{f}</p>
            </div>
          ))}
        </div>
        <div style={{ background: 'linear-gradient(160deg,#eff6ff,#ffffff)', border: '1px solid #e6edf7', borderRadius: 32, padding: 28, boxShadow: '0 25px 70px rgba(0,38,100,.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div><span style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>PANEL</span><h3 style={{ fontSize: 25, color: '#081225' }}>Control de Rifa</h3></div>
            <span style={{ background: 'rgba(0,200,83,.12)', color: C.success, padding: '8px 12px', borderRadius: 999, fontWeight: 900, height: 36 }}>Online</span>
          </div>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 18 }}>
            {[['RD$54,750','Vendido'],['365','Tickets'],['73%','Progreso'],['24','Pendientes']].map(([v,l]) => <div key={l} style={{ background: '#fff', borderRadius: 18, padding: 18, border: '1px solid #edf2f7' }}><b style={{ fontSize: 24, color: C.primary }}>{v}</b><p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{l}</p></div>)}
          </div>
          <div style={{ background: '#071225', color: '#fff', borderRadius: 22, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><strong>Últimos pagos</strong><span style={{ color: '#7dd3fc' }}>En vivo</span></div>
            {['#0281 Ana R. RD$150', '#0440 Luis M. RD$300', '#0007 Carlos P. RD$150'].map(x => <div key={x} style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,.10)', color: 'rgba(255,255,255,.78)' }}>{x}</div>)}
          </div>
        </div>
      </div>
    </section>
  )
}

function AdminSection() {
  return (
    <section style={{ padding: '100px 24px', background: '#f1f5f9' }}>
      <SectionTitle badge="Motor del negocio" title="Control total desde tu" highlight="panel administrativo" desc="Todo lo que antes estaba regado en WhatsApp, notas y Excel ahora vive en un solo lugar." />
      <div className="features-grid" style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
        {adminCards.map(card => <div key={card.title} style={{ background: '#fff', borderRadius: 24, padding: 28, border: '1px solid #e6edf7', boxShadow: '0 12px 34px rgba(15,23,42,.06)' }}>
          <div style={{ width: 54, height: 54, borderRadius: 18, background: 'rgba(0,102,255,.09)', color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 18 }}><i className={`fas ${card.icon}`} /></div>
          <h3 style={{ fontSize: 20, marginBottom: 10, color: '#081225' }}>{card.title}</h3>
          <p style={{ color: '#64748b', lineHeight: 1.65 }}>{card.desc}</p>
        </div>)}
      </div>
    </section>
  )
}

function PlansSection() {
  const navigate = useNavigate()
  return (
    <section id="planes" style={{ padding: '100px 24px', background: '#071225' }}>
      <SectionTitle dark badge="Planes" title="Elige tu plan y" highlight="empieza hoy" desc="Sin complicaciones. El sistema se adapta a rifas pequeñas, negocios que empiezan y operadores que quieren escalar." />
      <div className="pricing-grid" style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
        {PLANS.map(plan => <div key={plan.id} style={{ position: 'relative', background: plan.featured ? C.gradient : '#fff', color: plan.featured ? '#fff' : '#081225', borderRadius: 28, padding: 30, boxShadow: plan.featured ? '0 25px 70px rgba(0,102,255,.35)' : '0 15px 40px rgba(0,0,0,.16)', transform: plan.featured ? 'translateY(-14px)' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}><h3 style={{ fontSize: 24 }}>{plan.label}</h3><span style={{ background: plan.featured ? 'rgba(255,255,255,.22)' : 'rgba(0,102,255,.08)', color: plan.featured ? '#fff' : C.primary, borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 900 }}>{plan.featured ? 'Recomendado' : plan.id === 'demo' ? 'Para probar' : 'Para escalar'}</span></div>
          <div style={{ fontSize: 44, fontWeight: 950, marginBottom: 4 }}>{plan.price === 0 ? 'RD$0' : `RD$${plan.price.toLocaleString()}`}</div>
          <p style={{ opacity: .74, marginBottom: 24 }}>{plan.period}</p>
          <div style={{ display: 'grid', gap: 12, marginBottom: 26 }}>
            {plan.features.map(f => <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center' }}><i className="fas fa-check-circle" style={{ color: plan.featured ? '#fff' : C.success }} /><span>{f}</span></div>)}
          </div>
          <button onClick={() => navigate(plan.id === 'demo' ? '/demo' : '/register')} className={plan.featured ? 'btn-outline' : 'btn-primary'} style={{ width: '100%', padding: 15, background: plan.featured ? '#fff' : undefined, color: plan.featured ? C.primary : '#fff', border: plan.featured ? 'none' : undefined }}>{plan.id === 'demo' ? 'Probar demo' : `Comprar ${plan.label}`}</button>
        </div>)}
      </div>
    </section>
  )
}

function ComparisonSection() {
  return (
    <section style={{ padding: '90px 24px', background: '#fff' }}>
      <SectionTitle badge="Comparativa" title="Compara las" highlight="características" desc="Una vista rápida para saber qué le conviene a cada organizador." />
      <div style={{ maxWidth: 1080, margin: '0 auto', overflowX: 'auto', border: '1px solid #e6edf7', borderRadius: 24, boxShadow: '0 18px 50px rgba(15,23,42,.06)' }}>
        <table style={{ minWidth: 760, background: '#fff' }}>
          <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: 20 }}>Características</th><th style={{ padding: 20 }}>Plan Básico</th><th style={{ padding: 20 }}>Plan PRO</th></tr></thead>
          <tbody>{comparison.map((row, i) => <tr key={row[0]} style={{ borderTop: '1px solid #edf2f7', background: i % 2 ? '#fff' : '#fbfdff' }}>{row.map((cell, j) => <td key={`${j}-${cell}`} style={{ padding: 18, color: j === 0 ? '#081225' : '#475569', fontWeight: j === 0 ? 800 : 650 }}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </section>
  )
}

function SocialProof() {
  return (
    <section id="clientes" style={{ padding: '100px 24px', background: '#f8fafc' }}>
      <SectionTitle badge="Clientes" title="El sistema para rifas que quieren" highlight="verse profesionales" desc="Muestra plataformas activas, testimonios y comunidad para generar confianza antes de comprar." />
      <div className="features-grid" style={{ maxWidth: 1120, margin: '0 auto 34px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
        {clients.map(c => <div key={c.name} style={{ background: '#fff', border: '1px solid #e6edf7', borderRadius: 26, padding: 26, boxShadow: '0 15px 40px rgba(15,23,42,.06)' }}>
          <div style={{ height: 170, borderRadius: 22, background: 'linear-gradient(160deg,#071225,#0f62fe)', color: '#fff', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 950 }}>{c.letter}</div>
            <div><h3>{c.name}</h3><p style={{ color: 'rgba(255,255,255,.7)', fontSize: 13 }}>{c.domain}</p></div>
          </div>
          <p style={{ color: C.success, fontWeight: 900 }}><i className="fas fa-circle-check" /> Plataforma activa</p>
        </div>)}
      </div>
      <div style={{ maxWidth: 1120, margin: '0 auto 34px', background: 'linear-gradient(135deg,#08c78a,#FFC400)', borderRadius: 30, padding: 34, color: '#fff', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 24, alignItems: 'center' }}>
        <div><span style={{ background: 'rgba(255,255,255,.20)', padding: '7px 12px', borderRadius: 999, fontWeight: 900, fontSize: 12 }}>Comunidad exclusiva</span><h2 style={{ marginTop: 14, fontSize: 32 }}>Únete al canal oficial</h2><p style={{ opacity: .85, marginTop: 8 }}>Recibe tips de ventas, novedades, guías y soporte para crecer tus rifas.</p></div>
        <a href="https://wa.me/" target="_blank" rel="noreferrer" className="btn-outline" style={{ background: '#fff', color: '#07805f', border: 'none', padding: '15px 24px', textDecoration: 'none', fontWeight: 900 }}><i className="fab fa-whatsapp" /> Seguir el canal gratis</a>
      </div>
    </section>
  )
}

function TestimonialsFaq() {
  const [open, setOpen] = useState(0)
  return (
    <section id="testimonios" style={{ padding: '100px 24px', background: '#fff' }}>
      <SectionTitle badge="Testimonios" title="Lo que opinan los" highlight="clientes activos" />
      <div className="testimonials-grid" style={{ maxWidth: 1120, margin: '0 auto 85px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
        {testimonials.map(t => <div key={t.brand} style={{ border: '1px solid #e6edf7', borderRadius: 24, padding: 26, boxShadow: '0 12px 34px rgba(15,23,42,.05)' }}>
          <div style={{ color: '#f59e0b', marginBottom: 14 }}>{'★★★★★'}</div>
          <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 18 }}>“{t.text}”</p>
          <h4 style={{ color: '#081225' }}>{t.name}</h4><span style={{ color: '#64748b', fontSize: 13 }}>{t.brand}</span>
        </div>)}
      </div>
      <SectionTitle badge="FAQ" title="Preguntas" highlight="frecuentes" />
      <div style={{ maxWidth: 850, margin: '0 auto' }}>
        {faqs.map(([q, a], i) => <div key={q} style={{ border: '1px solid #e6edf7', borderRadius: 18, marginBottom: 12, overflow: 'hidden' }}>
          <button onClick={() => setOpen(open === i ? -1 : i)} style={{ width: '100%', padding: 20, background: '#fff', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 900, color: '#081225', fontSize: 16, textAlign: 'left' }}><span>{q}</span><i className={`fas ${open === i ? 'fa-chevron-up' : 'fa-chevron-down'}`} /></button>
          {open === i && <p style={{ padding: '0 20px 20px', color: '#64748b', lineHeight: 1.65 }}>{a}</p>}
        </div>)}
      </div>
    </section>
  )
}

export default function HomePage() {
  useSEO({ title: 'Rifas digitales simples y automatizadas', description: 'Crea y gestiona sorteos digitales con talonario online, WhatsApp, pagos organizados y panel administrativo.' })
  const whatsappNumber = import.meta.env.VITE_SUPPORT_WHATSAPP || '18099074452'
  const whatsappMessage = encodeURIComponent('Hola, quiero información sobre RyffasRD.')
  return (
    <main>
      <Hero />
      <PainSection />
      <PlatformSection />
      <AdminSection />
      <PlansSection />
      <ComparisonSection />
      <SocialProof />
      <TestimonialsFaq />
      <a
        className="whatsapp-float"
        href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Contactar a RyffasRD por WhatsApp"
        title="Hablar por WhatsApp"
      >
        <i className="fab fa-whatsapp" aria-hidden="true" />
        <span>¿Necesitas ayuda?</span>
      </a>
    </main>
  )
}
