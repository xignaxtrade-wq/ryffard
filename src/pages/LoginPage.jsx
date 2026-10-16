import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { C } from '../constants'
import { useSEO } from '../hooks'

export default function LoginPage() {
  useSEO({ title: 'Iniciar Sesión', description: 'Accede a tu panel de rifas en RyffasRD.' })
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 60px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="/logo-ryffasrd.png" alt="RyffasRD" width="96" height="96" style={{ display: 'block', objectFit: 'contain', margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--dark)', marginBottom: 8 }}>Bienvenido de vuelta</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Inicia sesión en tu cuenta</p>
        </div>

        <div style={{ background: 'var(--card)', borderRadius: 20, padding: 36, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--card-border)' }}>
          <form onSubmit={handleSubmit}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>Contraseña</label>
                <Link to="/forgot-password" style={{ color: C.primary, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>¿La olvidaste?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
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
              {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Entrando...</> : 'Iniciar Sesión'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: C.primary, fontWeight: 700, textDecoration: 'none' }}>Regístrate gratis</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
