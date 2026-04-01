import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MaintenanceList from './MaintenanceList'

vi.mock('../../lib/api', () => ({
  getAllMaintenanceSchedules: vi.fn(),
}))

import { getAllMaintenanceSchedules } from '../../lib/api'

describe('MaintenanceList', () => {
  it('shows schedules with elevator and customer info', async () => {
    getAllMaintenanceSchedules.mockResolvedValue({
      data: [{
        id: 'm1',
        visit_type: 'monthly',
        next_due_date: '2026-05-01',
        elevators: { unit_number: 'EL-01', buildings: { name: 'Main Tower', customers: { name: 'Acme Corp' } } }
      }],
      error: null,
    })
    render(<MemoryRouter><MaintenanceList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('EL-01')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })
  })

  it('highlights overdue schedules in red', async () => {
    getAllMaintenanceSchedules.mockResolvedValue({
      data: [{
        id: 'm1',
        visit_type: 'monthly',
        next_due_date: '2025-01-01',
        elevators: { unit_number: 'EL-01', buildings: { name: 'Main Tower', customers: { name: 'Acme Corp' } } }
      }],
      error: null,
    })
    render(<MemoryRouter><MaintenanceList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/overdue/i)).toBeInTheDocument()
    })
  })
})
