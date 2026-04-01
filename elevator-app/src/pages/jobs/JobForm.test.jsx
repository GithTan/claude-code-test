import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import JobForm from './JobForm'

vi.mock('../../lib/api', () => ({
  createJob: vi.fn(),
  getJob: vi.fn(),
  updateJob: vi.fn(),
  updateMaintenanceSchedule: vi.fn(),
  getAllMaintenanceSchedules: vi.fn(),
}))

import { createJob, getAllMaintenanceSchedules } from '../../lib/api'

describe('JobForm (new)', () => {
  it('renders required fields', async () => {
    getAllMaintenanceSchedules.mockResolvedValue({ data: [], error: null })
    render(
      <MemoryRouter initialEntries={['/jobs/new']}>
        <Routes>
          <Route path="/jobs/new" element={<JobForm />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByLabelText(/scheduled date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/technician/i)).toBeInTheDocument()
    })
  })

  it('calls createJob on submit', async () => {
    getAllMaintenanceSchedules.mockResolvedValue({
      data: [{ id: 's1', visit_type: 'monthly', elevators: { unit_number: 'EL-01', buildings: { name: 'Main Tower', customers: { name: 'Acme Corp' } } } }],
      error: null,
    })
    createJob.mockResolvedValue({ data: { id: 'j1' }, error: null })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/jobs/new']}>
        <Routes>
          <Route path="/jobs/new" element={<JobForm />} />
          <Route path="/jobs" element={<div>jobs</div>} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => screen.getByLabelText(/scheduled date/i))
    await user.type(screen.getByLabelText(/scheduled date/i), '2026-04-10')
    await user.type(screen.getByLabelText(/technician/i), 'Pedro')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(createJob).toHaveBeenCalled()
    })
  })
})
