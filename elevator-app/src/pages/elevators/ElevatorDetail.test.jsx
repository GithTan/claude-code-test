import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ElevatorDetail from './ElevatorDetail'

vi.mock('../../lib/api', () => ({
  getElevator: vi.fn(),
  getMaintenanceSchedules: vi.fn(),
}))

import { getElevator, getMaintenanceSchedules } from '../../lib/api'

describe('ElevatorDetail', () => {
  it('shows elevator unit number and maintenance schedules', async () => {
    getElevator.mockResolvedValue({ data: { id: 'e1', unit_number: 'EL-01', brand: 'Otis', model: 'Gen2', serial_number: 'SN123', elevator_type: 'Passenger', status: 'active', turnover_date: null, warranty_expiry: null, free_maintenance_end: null, building_id: 'b1' }, error: null })
    getMaintenanceSchedules.mockResolvedValue({ data: [{ id: 'm1', visit_type: 'monthly', next_due_date: '2026-05-01' }], error: null })
    render(
      <MemoryRouter initialEntries={['/elevators/e1']}>
        <Routes>
          <Route path="/elevators/:id" element={<ElevatorDetail />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('EL-01')).toBeInTheDocument()
      expect(screen.getByText(/monthly/i)).toBeInTheDocument()
    })
  })
})
