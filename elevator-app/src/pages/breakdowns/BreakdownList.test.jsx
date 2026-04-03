import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BreakdownList from './BreakdownList'

vi.mock('../../lib/api', () => ({
  getBreakdowns: vi.fn(),
}))

import { getBreakdowns } from '../../lib/api'

describe('BreakdownList', () => {
  it('shows breakdowns after loading', async () => {
    getBreakdowns.mockResolvedValue({
      data: [
        { id: 'b1', reported_date: '2026-04-03', priority: 'high', status: 'open', description: 'Elevator stuck', technician_name: null, elevators: { unit_number: 'E-01', buildings: { name: 'Tower 1', customers: { name: 'Acme Corp' } } } },
      ],
      error: null,
    })
    render(<MemoryRouter><BreakdownList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('Elevator stuck')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })
  })

  it('shows empty state when no breakdowns', async () => {
    getBreakdowns.mockResolvedValue({ data: [], error: null })
    render(<MemoryRouter><BreakdownList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/no breakdown/i)).toBeInTheDocument()
    })
  })

  it('shows Log Breakdown button', async () => {
    getBreakdowns.mockResolvedValue({ data: [], error: null })
    render(<MemoryRouter><BreakdownList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /log breakdown/i })).toBeInTheDocument()
    })
  })
})
