import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    lock: async (_name, _acquireTimeout, fn) => fn(),
  },
  global: {
    fetch: (url, options = {}) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 10000)
      return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timer))
    }
  }
})
