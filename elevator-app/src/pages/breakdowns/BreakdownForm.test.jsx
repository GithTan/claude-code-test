import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import BreakdownForm from './BreakdownForm'

vi.mock('../../lib/api', () => ({
  createBreakdown: vi.fn(),
  getBreakdown: vi.fn(),
  updateBreakdown: vi.fn(),
  getAllElevators: vi.fn(),
}))

import { createBreakdown, getAllElevators } from '../../lib/api'

describe('BreakdownForm (new)', () => {
  it('renders required fields', async () => {
    getAllElevators.mockResolvedValue({ data: [{ id: 'e1', unit_number: 'E-01', buildings: { name: 'Tower 1', customers: { name: 'Acme Corp' } } }], error: null })
    render(
      <MemoryRouter initialEntries={['/breakdowns/new']}>
        <Routes>
          <Route path="/breakdowns/new" element={<BreakdownForm />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByLabelText(/elevator/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument()
    })
  })

  it('calls createBreakdown on submit', async () => {
    getAllElevators.mockResolvedValue({ data: [{ id: 'e1', unit_number: 'E-01', buildings: { name: 'Tower 1', customers: { name: 'Acme Corp' } } }], error: null })
    createBreakdown.mockResolvedValue({ data: { id: 'b1' }, error: null })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/breakdowns/new']}>
        <Routes>
          <Route path="/breakdowns/new" element={<BreakdownForm />} />
          <Route path="/breakdowns" element={<div>list</div>} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => screen.getByLabelText(/elevator/i))
    await user.selectOptions(screen.getByLabelText(/elevator/i), 'e1')
    await user.type(screen.getByLabelText(/description/i), 'Door not closing')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(createBreakdown).toHaveBeenCalledWith(expect.objectContaining({ description: 'Door not closing' }))
    })
  })
})
