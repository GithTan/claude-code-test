import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CustomerList from './CustomerList'

vi.mock('../../lib/api', () => ({
  getCustomers: vi.fn(),
}))

import { getCustomers } from '../../lib/api'

describe('CustomerList', () => {
  it('shows customers after loading', async () => {
    getCustomers.mockResolvedValue({
      data: [
        { id: '1', name: 'Acme Corp', contact_person: 'Juan dela Cruz', phone: '09171234567' },
        { id: '2', name: 'BuildCo', contact_person: 'Maria Santos', phone: '09181234567' },
      ],
      error: null,
    })
    render(<MemoryRouter><CustomerList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('BuildCo')).toBeInTheDocument()
    })
  })

  it('shows empty state when no customers', async () => {
    getCustomers.mockResolvedValue({ data: [], error: null })
    render(<MemoryRouter><CustomerList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/no customers/i)).toBeInTheDocument()
    })
  })

  it('shows Add Customer button', async () => {
    getCustomers.mockResolvedValue({ data: [], error: null })
    render(<MemoryRouter><CustomerList /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /add customer/i })).toBeInTheDocument()
  })
})
