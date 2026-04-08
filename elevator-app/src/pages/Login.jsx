import { useState } from 'react'
import { supabase } from '../lib/supabase'

const TRIAL_EMAIL = 'staff@fiec.com'
const TRIAL_PASSWORD = 'fiec2026'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [trialLoading, setTrialLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setPassword('')
    }
    setLoading(false)
  }

  async function handleTrialAccess() {
    setError('')
    setTrialLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: TRIAL_EMAIL,
      password: TRIAL_PASSWORD,
    })
    if (error) setError('Trial access unavailable. Contact admin.')
    setTrialLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="w-full max-w-md p-8" style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37' }}>
        {/* Brand */}
        <div className="mb-6 text-center">
          <h1 className="font-brand text-3xl font-bold" style={{ color: '#2C2C2C' }}>FIEC Elevator</h1>
          <p className="text-sm mt-1" style={{ color: '#888888' }}>Sign in to your account</p>
        </div>

        {/* Staff trial access — one click */}
        <div style={{ marginBottom: 24, backgroundColor: '#2C2C2C', border: '1px solid #D4AF37', padding: 16 }}>
          <p style={{ fontSize: 12, color: '#D4AF37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Staff Trial Access
          </p>
          <p style={{ fontSize: 12, color: '#888888', marginBottom: 12 }}>
            Tap below to enter the app for review. No password needed.
          </p>
          <button
            onClick={handleTrialAccess}
            disabled={trialLoading}
            style={{
              width: '100%', backgroundColor: '#D4AF37', color: '#2C2C2C',
              border: 'none', padding: '10px 0', fontSize: 14, fontWeight: 700,
              cursor: trialLoading ? 'not-allowed' : 'pointer',
              opacity: trialLoading ? 0.6 : 1,
            }}
          >
            {trialLoading ? 'Entering…' : 'Enter App →'}
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: '#D4AF37', opacity: 0.3 }} />
          <span style={{ fontSize: 11, color: '#888888' }}>or sign in with credentials</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#D4AF37', opacity: 0.3 }} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: '#2C2C2C' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={{ border: '1px solid #D4AF37', backgroundColor: '#FFFFFF', color: '#2C2C2C' }}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: '#2C2C2C' }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={{ border: '1px solid #D4AF37', backgroundColor: '#FFFFFF', color: '#2C2C2C' }}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: '#2C2C2C', backgroundColor: '#E8E8E8', padding: '8px', border: '1px solid #AAAAAA' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#2C2C2C', color: '#D4AF37', border: '1px solid #D4AF37' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="flex justify-end mt-6">
          <span className="font-brand text-xs" style={{ color: '#D4AF37', opacity: 0.4 }}>RC77558</span>
        </div>
      </div>
    </div>
  )
}
