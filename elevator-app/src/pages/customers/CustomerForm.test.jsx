import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CustomerForm from './CustomerForm'

vi.mock('../../lib/api', () => ({
  createCustomer: vi.fn(),
  getCustomer: vi.fn(),
  updateCustomer: vi.fn(),
}))

import { createCustomer, getCustomer } from '../../lib/api'

describe('CustomerForm (new)', () => {
  it('renders all fields', () => {
    render(
      <MemoryRouter initialEntries={['/customers/new']}>
        <Routes>
          <Route path="/customers/new" element={<CustomerForm />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contact person/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('calls createCustomer on submit', async () => {
    createCustomer.mockResolvedValue({ data: { id: '1' }, error: null })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/customers/new']}>
        <Routes>
          <Route path="/customers/new" element={<CustomerForm />} />
          <Route path="/customers/:id" element={<div>detail</div>} />
        </Routes>
      </MemoryRouter>
    )
    await user.type(screen.getByLabelText(/company name/i), 'Acme Corp')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(createCustomer).toHaveBeenCalledWith(expect.objectContaining({ name: 'Acme Corp' }))
    })
  })
})
