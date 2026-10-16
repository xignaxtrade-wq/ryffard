import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { C } from '../constants'
import { useSEO } from '../hooks'

export default function RegisterPage() {
  useSEO({ title: 'Crear Cuenta Gratis', description: 'Regístrate gratis en RyffasRD y crea tu primera rifa digital en minutos.' })
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref') || null
  const { signUp } = useAuth()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    try {
      await signUp(email, password, name, refCode)
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 60px' }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ width: 80, height: 80, background: 'rgba(0,200,83,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <i className="fas fa-envelope-circle-check" style={{ fontSize: 36, color: C.success }} />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--dark)', marginBottom: 12 }}>¡Revisa tu correo!</h2>
          {refCode && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(217,11,36,0.1)', border: '1px solid rgba(217,11,36,0.3)', borderRadius: 50, padding: '4px 14px', fontSize: 13, color: C.primary, fontWeight: 600, marginBottom: 12 }}>
              <i className="fas fa-user-plus" />Cuenta creada con referido
            </div>
          )}
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 24 }}>
            Te enviamos un enlace de confirmación a <strong>{email}</strong>.<br />Confirma tu cuenta para continuar.
          </p>
          <Link to="/login" style={{ color: C.primary, fontWeight: 700, textDecoration: 'none' }}>Ir al Login →</Link>
        </div>
      </section>
    )
  }

  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 60px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="/logo-ryffasrd.png" alt="RyffasRD" width="96" height="96" style={{ display: 'block', objectFit: 'contain', margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--dark)', marginBottom: 8 }}>Crea tu cuenta gratis</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Empieza a organizar rifas profesionales hoy</p>
        </div>

        <div style={{ background: 'var(--card)', borderRadius: 20, padding: 36, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--card-border)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--dark)', marginBottom: 8 }}>Nombre completo</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--dark)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--dark)', marginBottom: 8 }}>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--dark)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--dark)', marginBottom: 8 }}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--dark)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(255,101,101,0.1)', border: '1px solid rgba(255,101,101,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#ff6565', fontSize: 14 }}>
                <i className="fas fa-circle-exclamation" style={{ marginRight: 8 }} />{error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Creando cuenta...</> : 'Crear Cuenta Gratis'}
            </button>

            <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 16 }}>
              Al registrarte aceptas nuestros <Link to="/terms" style={{ color: C.primary }}>Términos de Uso</Link> y <Link to="/privacy" style={{ color: C.primary }}>Política de Privacidad</Link>
            </p>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: C.primary, fontWeight: 700, textDecoration: 'none' }}>Iniciar sesión</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
