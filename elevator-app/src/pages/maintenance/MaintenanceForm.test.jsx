import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MaintenanceForm from './MaintenanceForm'

vi.mock('../../lib/api', () => ({
  createMaintenanceSchedule: vi.fn(),
  getMaintenanceSchedules: vi.fn(),
  updateMaintenanceSchedule: vi.fn(),
}))

import { createMaintenanceSchedule } from '../../lib/api'

describe('MaintenanceForm (new)', () => {
  it('renders visit type and due date fields', () => {
    render(
      <MemoryRouter initialEntries={['/elevators/e1/maintenance/new']}>
        <Routes>
          <Route path="/elevators/:elevatorId/maintenance/new" element={<MaintenanceForm />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/visit type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/next due date/i)).toBeInTheDocument()
  })

  it('calls createMaintenanceSchedule on submit', async () => {
    createMaintenanceSchedule.mockResolvedValue({ data: { id: 'm1', elevator_id: 'e1' }, error: null })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/elevators/e1/maintenance/new']}>
        <Routes>
          <Route path="/elevators/:elevatorId/maintenance/new" element={<MaintenanceForm />} />
          <Route path="/elevators/:id" element={<div>elevator</div>} />
        </Routes>
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(createMaintenanceSchedule).toHaveBeenCalledWith(expect.objectContaining({ elevator_id: 'e1' }))
    })
  })
})
