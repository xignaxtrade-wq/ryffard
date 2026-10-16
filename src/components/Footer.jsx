import { useNavigate } from 'react-router-dom'
import { C } from '../constants'

const navLinks  = [['Inicio', '/'], ['Precios', '/pricing'], ['Demo', '/demo'], ['Historial', '/history'], ['Dashboard', '/dashboard']]
const legalLinks = ['Términos de Uso', 'Privacidad', 'Cookies']
const socials    = ['fa-instagram', 'fa-tiktok', 'fa-whatsapp', 'fa-facebook']

export default function Footer() {
  const navigate = useNavigate()

  return (
    <footer style={{ background: '#1a1a2e', padding: '60px 24px 30px', color: 'rgba(255,255,255,0.6)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <img src="/logo-ryffasrd.png" alt="RyffasRD - Rifas y sorteos" width="160" height="160" style={{ display: 'block', objectFit: 'contain' }} />
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 300 }}>
              La plataforma más completa para organizar rifas digitales de forma profesional, transparente y segura.
            </p>
            {/* PWA hint */}
            <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(217,11,36,0.15)', padding: '8px 14px', borderRadius: 10 }}>
              <i className="fas fa-mobile-screen" style={{ color: C.primaryLight }} />
              <span style={{ fontSize: 12, color: C.primaryLight, fontWeight: 600 }}>Instala la app desde tu navegador</span>
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h4 style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Plataforma</h4>
            {navLinks.map(([label, path]) => (
              <div key={path} onClick={() => navigate(path)} style={{ fontSize: 14, marginBottom: 10, cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}>{label}</div>
            ))}
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Legal</h4>
            {legalLinks.map(l => (
              <div key={l} style={{ fontSize: 14, marginBottom: 10, cursor: 'pointer' }}>{l}</div>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Contacto</h4>
            <div style={{ fontSize: 14, marginBottom: 10 }}><i className="fab fa-whatsapp" style={{ marginRight: 8 }} />+1 809 907 4452</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              {socials.map(ic => (
                <div key={ic} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <i className={`fab ${ic}`} style={{ color: '#fff', fontSize: 16 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, textAlign: 'center', fontSize: 13 }}>
          © 2024–2026 RyffasRD. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
