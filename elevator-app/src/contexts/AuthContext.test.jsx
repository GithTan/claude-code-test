import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
    },
  }
}))

vi.mock('../lib/api', () => ({
  _setAuthToken: vi.fn(),
  _setViewerRole: vi.fn(),
  getProfile: vi.fn().mockResolvedValue({ data: null, error: null }),
}))

function TestComponent() {
  const { user, role, loading } = useAuth()
  if (loading) return <div>loading</div>
  return (
    <div>
      <span data-testid="user">{user ? 'logged-in' : 'logged-out'}</span>
      <span data-testid="role">{role || 'no-role'}</span>
    </div>
  )
}

describe('AuthContext', () => {
  it('shows logged-out state when no session', async () => {
    render(<AuthProvider><TestComponent /></AuthProvider>)
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('logged-out')
    })
  })

  it('allows anonymous trial users in as operations_manager', async () => {
    const { supabase } = await import('../lib/supabase')
    supabase.auth.getSession.mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'trial-token',
          user: {
            id: 'trial-user',
            is_anonymous: true,
            app_metadata: { provider: 'anonymous' },
            identities: [{ provider: 'anonymous' }],
          },
        },
      },
    })

    render(<AuthProvider><TestComponent /></AuthProvider>)
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('logged-in')
      expect(screen.getByTestId('role')).toHaveTextContent('operations_manager')
    })
  })
})
