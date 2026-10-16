import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import LogoGenerator from './LogoGenerator'

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 8,
  border: '1.5px solid var(--border)',
  background: 'var(--bg-alt)',
  color: 'var(--dark)',
  boxSizing: 'border-box',
}

export default function WhiteLabelSettings({ profile }) {
  const { user, refreshProfile } = useAuth()
  const [form, setForm] = useState({
    brand_name: '',
    brand_logo_url: '',
    brand_cover_url: '',
    brand_primary_color: '#D90B24',
    brand_secondary_color: '#FFC400',
  })
  const [uploading, setUploading] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setForm({
      brand_name: profile?.brand_name || profile?.name || '',
      brand_logo_url: profile?.brand_logo_url || '',
      brand_cover_url: profile?.brand_cover_url || '',
      brand_primary_color: profile?.brand_primary_color || '#D90B24',
      brand_secondary_color: profile?.brand_secondary_color || '#FFC400',
    })
  }, [profile])

  function update(key, value) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function uploadImage(event, kind) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setMessage('')
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError('Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.')
      return
    }

    setUploading(kind)
    const extension = file.name.split('.').pop().toLowerCase()
    const path = `white-label/${user.id}/${kind}-${Date.now()}.${extension}`
    const { error: uploadError } = await supabase.storage
      .from('rifa-images')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setError(`No se pudo subir la imagen: ${uploadError.message}`)
      setUploading('')
      return
    }

    const { data } = supabase.storage.from('rifa-images').getPublicUrl(path)
    update(kind === 'logo' ? 'brand_logo_url' : 'brand_cover_url', data.publicUrl)
    setUploading('')
  }

  async function save() {
    setError('')
    setMessage('')
    if (!form.brand_name.trim()) {
      setError('Escribe el nombre que verán tus participantes.')
      return
    }

    setSaving(true)
    const { error: saveError } = await supabase
      .from('profiles')
      .update({ ...form, brand_name: form.brand_name.trim() })
      .eq('id', user.id)

    if (saveError) {
      setError(`No se pudo guardar: ${saveError.message}`)
    } else {
      await refreshProfile()
      setMessage('Marca actualizada correctamente.')
    }
    setSaving(false)
  }

  const primary = form.brand_primary_color
  const secondary = form.brand_secondary_color
  const initial = (form.brand_name || 'M')[0].toUpperCase()

  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>Personaliza tu panel</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
        Usa tu nombre, logotipo, portada y colores. Tus participantes verán exclusivamente tu identidad comercial.
      </p>

      <div className="settings-brand-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 620px) minmax(280px, 400px)', gap: 24, alignItems: 'start' }}>
        <div style={{ background: 'var(--card)', borderRadius: 8, padding: 30, boxShadow: 'var(--shadow)' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Nombre de tu marca</label>
          <input
            value={form.brand_name}
            onChange={event => update('brand_name', event.target.value)}
            maxLength={60}
            placeholder="Ej. Premios Martínez"
            style={{ ...inputStyle, marginBottom: 22 }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
            {[
              { kind: 'logo', label: 'Logotipo', icon: 'fa-image', url: form.brand_logo_url },
              { kind: 'cover', label: 'Foto de portada', icon: 'fa-panorama', url: form.brand_cover_url },
            ].map(item => (
              <label key={item.kind} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, cursor: 'pointer', minHeight: 78 }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                  <i className={`fas ${item.icon}`} style={{ marginRight: 8, color: primary }} />
                  {item.label}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                  {uploading === item.kind ? 'Subiendo...' : item.url ? 'Cambiar imagen' : 'Seleccionar imagen'}
                </span>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => uploadImage(event, item.kind)} hidden disabled={Boolean(uploading)} />
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 28, marginBottom: 24 }}>
            {[
              ['Color principal', 'brand_primary_color'],
              ['Color secundario', 'brand_secondary_color'],
            ].map(([label, key]) => (
              <label key={key} style={{ fontSize: 13, fontWeight: 700 }}>
                <span style={{ display: 'block', marginBottom: 7 }}>{label}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="color" value={form[key]} onChange={event => update(key, event.target.value)} style={{ width: 48, height: 38, padding: 2, border: '1px solid var(--border)', borderRadius: 6 }} />
                  <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{form[key]}</span>
                </span>
              </label>
            ))}
          </div>

          <LogoGenerator
            userId={user.id}
            name={form.brand_name}
            primary={primary}
            secondary={secondary}
            onColorsChange={(nextPrimary, nextSecondary) => {
              update('brand_primary_color', nextPrimary)
              update('brand_secondary_color', nextSecondary)
            }}
            onUse={url => {
              update('brand_logo_url', url)
              setMessage('Logo generado. Guarda la identidad para publicarlo.')
            }}
          />

          {error && <div style={{ color: '#c62828', background: 'rgba(198,40,40,.08)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>{error}</div>}
          {message && <div style={{ color: '#087f5b', background: 'rgba(8,127,91,.08)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>{message}</div>}

          <button onClick={save} disabled={saving || Boolean(uploading)} className="btn-primary" style={{ width: '100%', padding: 14, border: 0, borderRadius: 8, cursor: saving ? 'wait' : 'pointer' }}>
            {saving ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Guardando...</> : <><i className="fas fa-floppy-disk" style={{ marginRight: 8 }} />Guardar identidad</>}
          </button>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', position: 'sticky', top: 100 }}>
          <div style={{ height: 160, background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
            {form.brand_cover_url && <img src={form.brand_cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div style={{ padding: 24 }}>
            {form.brand_logo_url
              ? <img src={form.brand_logo_url} alt="" style={{ width: 68, height: 68, objectFit: 'cover', borderRadius: 8, border: '4px solid #fff', marginTop: -58 }} />
              : <div style={{ width: 68, height: 68, borderRadius: 8, border: '4px solid #fff', marginTop: -58, background: primary, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 900 }}>{initial}</div>}
            <div style={{ fontSize: 21, fontWeight: 900, marginTop: 12 }}>{form.brand_name || 'Tu marca'}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '5px 0 18px' }}>Vista previa del talonario público</p>
            <button type="button" style={{ width: '100%', border: 0, borderRadius: 8, padding: 12, color: '#fff', background: primary, fontWeight: 800 }}>Participar ahora</button>
          </div>
        </div>
      </div>
    </>
  )
}
