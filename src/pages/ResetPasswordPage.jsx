import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSEO } from '../hooks'

export default function ResetPasswordPage() {
  useSEO({ title: 'Nueva contraseña', description: 'Define una nueva contraseña para RyffasRD.' })
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (password !== confirmation) return setError('Las contraseñas no coinciden.')
    setLoading(true)
    setError('')
    try {
      await updatePassword(password)
      navigate('/dashboard', { replace: true })
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-panel">
        <h1>Nueva contraseña</h1>
        <p>Utiliza al menos 8 caracteres.</p>
        <form onSubmit={submit}>
          <label>Nueva contraseña</label>
          <input type="password" value={password} onChange={event => setPassword(event.target.value)} required />
          <label>Confirmar contraseña</label>
          <input type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} required />
          {error && <div className="form-error">{error}</div>}
          <button className="btn-primary auth-submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar contraseña'}</button>
        </form>
      </div>
    </section>
  )
}
