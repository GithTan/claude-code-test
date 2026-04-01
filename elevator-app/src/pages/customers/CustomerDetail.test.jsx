import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CustomerDetail from './CustomerDetail'

vi.mock('../../lib/api', () => ({
  getCustomer: vi.fn(),
  getBuildings: vi.fn(),
}))

import { getCustomer, getBuildings } from '../../lib/api'

describe('CustomerDetail', () => {
  it('shows customer name and buildings', async () => {
    getCustomer.mockResolvedValue({ data: { id: '1', name: 'Acme Corp', contact_person: 'Juan', phone: '09171234567', email: 'juan@acme.com', address: 'Makati' }, error: null })
    getBuildings.mockResolvedValue({ data: [{ id: 'b1', name: 'Main Tower', address: 'Ayala Ave' }], error: null })

    render(
      <MemoryRouter initialEntries={['/customers/1']}>
        <Routes>
          <Route path="/customers/:id" element={<CustomerDetail />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('Main Tower')).toBeInTheDocument()
    })
  })

  it('shows Add Building link', async () => {
    getCustomer.mockResolvedValue({ data: { id: '1', name: 'Acme Corp', contact_person: '', phone: '', email: '', address: '' }, error: null })
    getBuildings.mockResolvedValue({ data: [], error: null })

    render(
      <MemoryRouter initialEntries={['/customers/1']}>
        <Routes>
          <Route path="/customers/:id" element={<CustomerDetail />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /add building/i })).toBeInTheDocument()
    })
  })
})
