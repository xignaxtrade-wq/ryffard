import { Component } from 'react'
import { C } from '../constants'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Aqui se conectaria con un servicio de logging (ej. Sentry)
    console.error('ErrorBoundary atrapó un error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,75,204,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <i className="fas fa-triangle-exclamation" style={{ fontSize: 36, color: C.secondary }} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--dark)', marginBottom: 12 }}>
            Algo salió mal
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32 }}>
            Ocurrió un error inesperado. Por favor recarga la página o regresa al inicio.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
              style={{ padding: '12px 28px', fontSize: 14 }}
            >
              <i className="fas fa-rotate-right" style={{ marginRight: 8 }} />Recargar
            </button>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
              className="btn-outline"
              style={{ padding: '12px 28px', fontSize: 14 }}
            >
              <i className="fas fa-home" style={{ marginRight: 8 }} />Ir al Inicio
            </button>
          </div>
        </div>
      </section>
    )
  }
}
