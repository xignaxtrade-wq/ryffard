import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { C } from '../constants'

export default function PWABanner() {
  const { pathname } = useLocation()
  const [installPrompt, setInstallPrompt] = useState(null)
  const [visible, setVisible]             = useState(false)

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); setVisible(true) }
    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      await installPrompt.userChoice
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={`pwa-install-banner${pathname === '/dashboard' ? ' pwa-install-dashboard' : ''}`} style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--card)', borderRadius: 16, padding: '16px 24px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      display: 'flex', alignItems: 'center', gap: 16,
      zIndex: 9999, border: '1px solid var(--border)',
      animation: 'fadeInUp 0.4s ease-out',
      maxWidth: 460, width: 'calc(100% - 48px)',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: C.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className="fas fa-mobile-screen" style={{ color: '#fff', fontSize: 20 }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>Instalar RyffasRD</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Agrega la app a tu celular. Sin Play Store ni App Store.</div>
      </div>
      <button onClick={handleInstall} className="btn-primary" style={{ padding: '8px 18px', fontSize: 13, whiteSpace: 'nowrap' }}>
        Instalar
      </button>
      <i className="fas fa-times" onClick={() => setVisible(false)} style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, flexShrink: 0 }} />
    </div>
  )
}
