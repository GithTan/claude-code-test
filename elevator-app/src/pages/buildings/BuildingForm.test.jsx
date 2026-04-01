import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import BuildingForm from './BuildingForm'

vi.mock('../../lib/api', () => ({
  createBuilding: vi.fn(),
  getBuilding: vi.fn(),
  updateBuilding: vi.fn(),
}))

import { createBuilding } from '../../lib/api'

describe('BuildingForm (new)', () => {
  it('renders building name field', () => {
    render(
      <MemoryRouter initialEntries={['/customers/1/buildings/new']}>
        <Routes>
          <Route path="/customers/:customerId/buildings/new" element={<BuildingForm />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/building name/i)).toBeInTheDocument()
  })

  it('calls createBuilding on submit', async () => {
    createBuilding.mockResolvedValue({ data: { id: 'b1', customer_id: '1' }, error: null })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/customers/1/buildings/new']}>
        <Routes>
          <Route path="/customers/:customerId/buildings/new" element={<BuildingForm />} />
          <Route path="/customers/:id" element={<div>customer</div>} />
        </Routes>
      </MemoryRouter>
    )
    await user.type(screen.getByLabelText(/building name/i), 'Main Tower')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(createBuilding).toHaveBeenCalledWith(expect.objectContaining({ name: 'Main Tower', customer_id: '1' }))
    })
  })
})
