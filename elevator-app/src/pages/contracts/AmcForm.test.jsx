import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AmcForm from './AmcForm'

vi.mock('../../lib/api', () => ({
  createAmcContract: vi.fn(),
  getAmcContract: vi.fn(),
  updateAmcContract: vi.fn(),
  getCustomers: vi.fn(),
}))

import { createAmcContract, getCustomers } from '../../lib/api'

describe('AmcForm (new)', () => {
  it('renders required fields', async () => {
    getCustomers.mockResolvedValue({ data: [{ id: 'c1', name: 'Acme Corp' }], error: null })
    render(
      <MemoryRouter initialEntries={['/contracts/new']}>
        <Routes>
          <Route path="/contracts/new" element={<AmcForm />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByLabelText(/contract number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/customer/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
    })
  })

  it('calls createAmcContract on submit', async () => {
    getCustomers.mockResolvedValue({ data: [{ id: 'c1', name: 'Acme Corp' }], error: null })
    createAmcContract.mockResolvedValue({ data: { id: 'a1' }, error: null })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/contracts/new']}>
        <Routes>
          <Route path="/contracts/new" element={<AmcForm />} />
          <Route path="/contracts/:id" element={<div>detail</div>} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => screen.getByLabelText(/contract number/i))
    await user.type(screen.getByLabelText(/contract number/i), 'AMC-001')
    await user.selectOptions(screen.getByLabelText(/customer/i), 'c1')
    await user.type(screen.getByLabelText(/start date/i), '2026-01-01')
    await user.type(screen.getByLabelText(/end date/i), '2026-12-31')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(createAmcContract).toHaveBeenCalledWith(expect.objectContaining({ contract_number: 'AMC-001' }))
    })
  })
})
