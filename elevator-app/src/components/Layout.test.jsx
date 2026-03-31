import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Layout from './Layout'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}))

import { useAuth } from '../contexts/AuthContext'

describe('Layout', () => {
  it('shows all nav items for admin', () => {
    useAuth.mockReturnValue({ user: { email: 'admin@test.com' }, role: 'admin', signOut: vi.fn() })
    render(
      <MemoryRouter>
        <Layout><div>content</div></Layout>
      </MemoryRouter>
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Customers')).toBeInTheDocument()
    expect(screen.getByText('Elevators')).toBeInTheDocument()
    expect(screen.getByText('Maintenance')).toBeInTheDocument()
    expect(screen.getByText('Jobs')).toBeInTheDocument()
    expect(screen.getByText('Invoices')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
  })

  it('hides Invoices for operations_manager', () => {
    useAuth.mockReturnValue({ user: { email: 'ops@test.com' }, role: 'operations_manager', signOut: vi.fn() })
    render(
      <MemoryRouter>
        <Layout><div>content</div></Layout>
      </MemoryRouter>
    )
    expect(screen.queryByText('Invoices')).not.toBeInTheDocument()
    expect(screen.getByText('Maintenance')).toBeInTheDocument()
  })
})
