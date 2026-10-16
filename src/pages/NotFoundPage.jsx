import { useNavigate } from 'react-router-dom'
import { C } from '../constants'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }} className="page-enter">
        <div style={{ fontSize: 120, fontWeight: 900, background: C.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, marginBottom: 16 }}>
          404
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)', marginBottom: 12 }}>
          Página no encontrada
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 40 }}>
          Esta página no existe o fue eliminada. Vuelve al inicio y continúa explorando RyffasRD.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '14px 32px', fontSize: 15 }}>
            <i className="fas fa-home" style={{ marginRight: 8 }} />Ir al Inicio
          </button>
          <button onClick={() => navigate(-1)} className="btn-outline" style={{ padding: '14px 32px', fontSize: 15 }}>
            <i className="fas fa-arrow-left" style={{ marginRight: 8 }} />Volver
          </button>
        </div>
      </div>
    </section>
  )
}
