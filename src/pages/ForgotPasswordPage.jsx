import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { C } from '../constants'
import { useSEO } from '../hooks'

export default function ForgotPasswordPage() {
  useSEO({ title: 'Recuperar contraseña', description: 'Recupera el acceso a tu cuenta de RyffasRD.' })
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await requestPasswordReset(email)
      setMessage('Revisa tu correo. Si la cuenta existe, recibirás un enlace para cambiar la contraseña.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-panel">
        <h1>Recuperar contraseña</h1>
        <p>Escribe el correo asociado a tu cuenta.</p>
        <form onSubmit={submit}>
          <label>Correo electrónico</label>
          <input type="email" value={email} onChange={event => setEmail(event.target.value)} required />
          {message && <div className="form-success">{message}</div>}
          {error && <div className="form-error">{error}</div>}
          <button className="btn-primary auth-submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar enlace'}</button>
        </form>
        <Link to="/login" style={{ color: C.primary, fontWeight: 700 }}>Volver al inicio de sesión</Link>
      </div>
    </section>
  )
}
