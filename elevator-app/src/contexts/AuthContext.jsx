import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { _setAuthToken, getProfile } from '../lib/api'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    const { data, error } = await getProfile(userId)
    if (error || !data) {
      await supabase.auth.signOut()
    } else {
      setRole(data.role)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000)
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout)
      setUser(session?.user ?? null)
      _setAuthToken(session?.access_token ?? null)
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    }).catch(() => { clearTimeout(timeout); setLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        _setAuthToken(session?.access_token ?? null)
        if (session?.user) {
          if (event === 'TOKEN_REFRESHED') {
            // Token silently refreshed — just update the token, no need to reload profile
            return
          }
          await loadProfile(session.user.id)
        } else {
          setRole(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    _setAuthToken(null)
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
