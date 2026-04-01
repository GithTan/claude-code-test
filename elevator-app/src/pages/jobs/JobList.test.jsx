import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import JobList from './JobList'

vi.mock('../../lib/api', () => ({
  getJobs: vi.fn(),
}))

import { getJobs } from '../../lib/api'

const mockJobs = [
  { id: 'j1', scheduled_date: '2026-04-01', status: 'scheduled', technician_name: 'Pedro', elevators: { unit_number: 'EL-01', buildings: { name: 'Main Tower', customers: { name: 'Acme Corp' } } }, maintenance_schedules: { visit_type: 'monthly' } },
  { id: 'j2', scheduled_date: '2026-03-15', status: 'completed', technician_name: 'Juan', elevators: { unit_number: 'EL-02', buildings: { name: 'South Wing', customers: { name: 'BuildCo' } } }, maintenance_schedules: { visit_type: 'quarterly' } },
]

describe('JobList', () => {
  it('shows all jobs', async () => {
    getJobs.mockResolvedValue({ data: mockJobs, error: null })
    render(<MemoryRouter><JobList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('EL-01')).toBeInTheDocument()
      expect(screen.getByText('EL-02')).toBeInTheDocument()
    })
  })

  it('filters by status', async () => {
    getJobs.mockResolvedValue({ data: mockJobs, error: null })
    const user = userEvent.setup()
    render(<MemoryRouter><JobList /></MemoryRouter>)
    await waitFor(() => screen.getByText('EL-01'))
    await user.selectOptions(screen.getByRole('combobox'), 'completed')
    expect(screen.queryByText('EL-01')).not.toBeInTheDocument()
    expect(screen.getByText('EL-02')).toBeInTheDocument()
  })

  it('shows Add Job button', async () => {
    getJobs.mockResolvedValue({ data: [], error: null })
    render(<MemoryRouter><JobList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /add job/i })).toBeInTheDocument()
    })
  })
})
