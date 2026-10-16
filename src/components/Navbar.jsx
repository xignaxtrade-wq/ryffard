import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { C } from '../constants'

const links = [
  { label: 'La Plataforma', hash: 'plataforma' },
  { label: 'Beneficios', hash: 'beneficios' },
  { label: 'Clientes', hash: 'clientes' },
  { label: 'Testimonios', hash: 'testimonios' },
  { label: 'Planes', hash: 'planes' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { dark, toggle } = useTheme()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const navBg = scrolled
    ? (dark ? 'rgba(15,15,26,0.95)' : 'rgba(255,255,255,0.95)')
    : 'rgba(255,255,255,0.78)'

  function goHash(hash) {
    const scroll = () => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(scroll, 80)
    } else {
      scroll()
    }
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      padding: scrolled ? '10px 0' : '16px 0',
      background: navBg,
      backdropFilter: 'blur(20px)',
      boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid rgba(255,255,255,.35)',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <img src="/logo-ryffasrd.png" alt="RyffasRD - Rifas y sorteos" width="80" height="80" style={{ display: 'block', objectFit: 'contain', flexShrink: 0 }} />
        </div>

        <div style={{ display: 'flex', gap: 22, alignItems: 'center' }} className="hide-mobile">
          {links.map(l => (
            <span key={l.hash} onClick={() => goHash(l.hash)} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 750, color: 'var(--text)', paddingBottom: 4, transition: 'all 0.2s ease' }}>
              {l.label}
            </span>
          ))}

          <button onClick={toggle} style={{ width: 40, height: 40, borderRadius: '50%', background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <i className={`fas ${dark ? 'fa-sun' : 'fa-moon'}`} style={{ color: dark ? C.warning : C.primary, fontSize: 16 }} />
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 800, color: location.pathname === '/dashboard' ? C.primary : 'var(--text)' }}>Dashboard</span>
              <button onClick={async () => { await signOut(); navigate('/') }} style={{ padding: '10px 18px', fontSize: 13, borderRadius: 999, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 700 }}>
                <i className="fas fa-sign-out-alt" style={{ marginRight: 6 }} />Salir
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/register')} className="btn-primary" style={{ padding: '12px 22px', fontSize: 13, textTransform: 'uppercase' }}>
              Comienza Gratis
            </button>
          )}
        </div>

        <button onClick={() => setMobileOpen(o => !o)} className="show-mobile-only" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text)' }}>
          <i className={`fas ${mobileOpen ? 'fa-times' : 'fa-bars'}`} />
        </button>
      </div>

      {mobileOpen && (
        <div style={{ background: 'var(--card)', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          {links.map(l => (
            <div key={l.hash} onClick={() => goHash(l.hash)} style={{ padding: '12px 0', fontSize: 15, fontWeight: 700, color: 'var(--text)', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>{l.label}</div>
          ))}
          <div style={{ paddingTop: 16, display: 'flex', gap: 12 }}>
            <button onClick={toggle} style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
              <i className={`fas ${dark ? 'fa-sun' : 'fa-moon'}`} style={{ color: dark ? C.warning : C.primary }} /> {dark ? 'Modo Claro' : 'Modo Oscuro'}
            </button>
            {user
              ? <button onClick={async () => { await signOut(); navigate('/') }} style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>Cerrar Sesión</button>
              : <button onClick={() => navigate('/register')} className="btn-primary" style={{ flex: 1, padding: '10px' }}>Comenzar Gratis</button>
            }
          </div>
        </div>
      )}
    </nav>
  )
}
