import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ElevatorList from './ElevatorList'

vi.mock('../../lib/api', () => ({
  getElevators: vi.fn(),
  getBuilding: vi.fn(),
}))

import { getElevators, getBuilding } from '../../lib/api'

describe('ElevatorList', () => {
  it('shows elevators after loading', async () => {
    getBuilding.mockResolvedValue({ data: { id: 'b1', name: 'Main Tower', customer_id: 'c1' }, error: null })
    getElevators.mockResolvedValue({
      data: [
        { id: 'e1', unit_number: 'EL-01', brand: 'Otis', status: 'active', turnover_date: null },
      ],
      error: null,
    })
    render(
      <MemoryRouter initialEntries={['/buildings/b1/elevators']}>
        <Routes>
          <Route path="/buildings/:buildingId/elevators" element={<ElevatorList />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('EL-01')).toBeInTheDocument()
    })
  })

  it('shows Add Elevator button', async () => {
    getBuilding.mockResolvedValue({ data: { id: 'b1', name: 'Main Tower', customer_id: 'c1' }, error: null })
    getElevators.mockResolvedValue({ data: [], error: null })
    render(
      <MemoryRouter initialEntries={['/buildings/b1/elevators']}>
        <Routes>
          <Route path="/buildings/:buildingId/elevators" element={<ElevatorList />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /add elevator/i })).toBeInTheDocument()
    })
  })
})
