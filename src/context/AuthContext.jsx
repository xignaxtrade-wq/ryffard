import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  async function refreshProfile() {
    if (user?.id) await fetchProfile(user.id)
  }

  async function signUp(email, password, name, refCode = null) {
    if (!supabaseReady) throw new Error('Error de configuración: Faltan las variables de entorno de Supabase.')
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw error

    if (data.user) {
      const profileData = { id: data.user.id, name, email }
      if (refCode) profileData.referred_by = refCode
      await supabase.from('profiles').upsert(profileData, { onConflict: 'id' })
    }
    return data
  }

  async function signIn(email, password) {
    if (!supabaseReady) throw new Error('Error de configuración: Faltan las variables de entorno de Supabase.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function requestPasswordReset(email) {
    if (!supabaseReady) throw new Error('Error de configuración: Faltan las variables de entorno de Supabase.')
    const redirectTo = `${window.location.origin}/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw error
  }

  async function updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, requestPasswordReset, updatePassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
