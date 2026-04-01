import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ElevatorForm from './ElevatorForm'

vi.mock('../../lib/api', () => ({
  createElevator: vi.fn(),
  getElevator: vi.fn(),
  updateElevator: vi.fn(),
}))

import { createElevator } from '../../lib/api'

describe('ElevatorForm (new)', () => {
  it('renders unit number field', () => {
    render(
      <MemoryRouter initialEntries={['/buildings/b1/elevators/new']}>
        <Routes>
          <Route path="/buildings/:buildingId/elevators/new" element={<ElevatorForm />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/unit number/i)).toBeInTheDocument()
  })

  it('calls createElevator on submit', async () => {
    createElevator.mockResolvedValue({ data: { id: 'e1', building_id: 'b1' }, error: null })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/buildings/b1/elevators/new']}>
        <Routes>
          <Route path="/buildings/:buildingId/elevators/new" element={<ElevatorForm />} />
          <Route path="/elevators/:id" element={<div>detail</div>} />
        </Routes>
      </MemoryRouter>
    )
    await user.type(screen.getByLabelText(/unit number/i), 'EL-01')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(createElevator).toHaveBeenCalledWith(expect.objectContaining({ unit_number: 'EL-01', building_id: 'b1' }))
    })
  })
})
