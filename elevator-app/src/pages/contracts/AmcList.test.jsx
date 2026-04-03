import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AmcList from './AmcList'

vi.mock('../../lib/api', () => ({
  getAmcContracts: vi.fn(),
}))

import { getAmcContracts } from '../../lib/api'

describe('AmcList', () => {
  it('shows contracts after loading', async () => {
    getAmcContracts.mockResolvedValue({
      data: [
        { id: 'c1', contract_number: 'AMC-001', contract_type: 'comprehensive', start_date: '2026-01-01', end_date: '2026-12-31', monthly_fee: 5000, status: 'active', customers: { name: 'Acme Corp' } },
      ],
      error: null,
    })
    render(<MemoryRouter><AmcList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('AMC-001')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })
  })

  it('shows empty state when no contracts', async () => {
    getAmcContracts.mockResolvedValue({ data: [], error: null })
    render(<MemoryRouter><AmcList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/no contracts/i)).toBeInTheDocument()
    })
  })

  it('shows New Contract button', async () => {
    getAmcContracts.mockResolvedValue({ data: [], error: null })
    render(<MemoryRouter><AmcList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /new contract/i })).toBeInTheDocument()
    })
  })
})
