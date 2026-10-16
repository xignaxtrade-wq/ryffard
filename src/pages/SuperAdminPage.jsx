import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { C } from '../constants'
import { useAuth } from '../context/AuthContext'

export default function SuperAdminPage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (error) alert('No se pudieron cargar los usuarios: ' + error.message)
    if (data) setUsers(data)
    setLoading(false)
  }

  async function changePlan(userId, newPlan) {
    if (!confirm(`¿Estás seguro de cambiar el plan a ${newPlan.toUpperCase()}?`)) return
    
    const { error } = await supabase.rpc('admin_change_plan', {
      p_user_id: userId,
      p_plan: newPlan,
    })
    if (error) {
      alert('Error cambiando el plan: ' + error.message)
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, plan: newPlan } : u))
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontWeight: 700 }}>Cargando datos maestros...</div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--dark)' }}>
      <header style={{ background: 'var(--card)', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow)', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: C.primary, margin: 0 }}><i className="fas fa-crown" style={{ marginRight: 12, color: C.warning }}/>Panel Maestro</h1>
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Volver al Dashboard normal</button>
          <button onClick={signOut} style={{ background: 'rgba(0,75,204,0.1)', color: C.secondary, border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cerrar Sesión</button>
        </div>
      </header>

      <main style={{ padding: 40, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
          <div style={{ background: 'var(--card)', padding: 24, borderRadius: 16, boxShadow: 'var(--shadow)', borderLeft: `4px solid var(--dark)` }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>Total de Usuarios</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--dark)' }}>{users.length}</div>
          </div>
          <div style={{ background: 'var(--card)', padding: 24, borderRadius: 16, boxShadow: 'var(--shadow)', borderLeft: `4px solid ${C.primary}` }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>Usuarios PRO</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: C.primary }}>{users.filter(u => u.plan === 'pro').length}</div>
          </div>
          <div style={{ background: 'var(--card)', padding: 24, borderRadius: 16, boxShadow: 'var(--shadow)', borderLeft: `4px solid ${C.success}` }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>Usuarios Básicos</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: C.success }}>{users.filter(u => u.plan === 'basic').length}</div>
          </div>
          <div style={{ background: 'var(--card)', padding: 24, borderRadius: 16, boxShadow: 'var(--shadow)', borderLeft: `4px solid var(--border)` }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>Usuarios Demo</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-secondary)' }}>{users.filter(u => u.plan === 'demo').length}</div>
          </div>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, color: 'var(--dark)' }}>Gestión de Organizadores</h2>
        <div style={{ background: 'var(--card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
              <thead style={{ background: 'var(--bg-alt)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: 16, fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>Usuario</th>
                  <th style={{ padding: 16, fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>Registro</th>
                  <th style={{ padding: 16, fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>Plan Actual</th>
                  <th style={{ padding: 16, fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>Acciones (Cambiar Plan)</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 16 }}>
                      <div style={{ fontWeight: 700, color: 'var(--dark)' }}>
                        {u.name} 
                        {u.is_superadmin && <span style={{ background: C.warning, color: '#000', fontSize: 10, padding: '2px 6px', borderRadius: 4, marginLeft: 8, fontWeight: 800 }}>ADMIN</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: 16 }}>
                      <span style={{ 
                        background: u.plan === 'pro' ? 'rgba(217,11,36,0.1)' : u.plan === 'basic' ? 'rgba(0,200,83,0.1)' : 'var(--bg-alt)',
                        color: u.plan === 'pro' ? C.primary : u.plan === 'basic' ? C.success : 'var(--text-secondary)',
                        padding: '6px 12px', borderRadius: 50, fontSize: 13, fontWeight: 700, textTransform: 'uppercase'
                      }}>
                        {u.plan}
                      </span>
                    </td>
                    <td style={{ padding: 16 }}>
                      <select 
                        value={u.plan} 
                        onChange={(e) => changePlan(u.id, e.target.value)}
                        disabled={u.is_superadmin}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-alt)', cursor: u.is_superadmin ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}
                      >
                        <option value="demo">Demo</option>
                        <option value="basic">Básico</option>
                        <option value="pro">PRO</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
