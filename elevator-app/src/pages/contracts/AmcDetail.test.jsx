import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AmcDetail from './AmcDetail'

vi.mock('../../lib/api', () => ({
  getAmcContract: vi.fn(),
}))

import { getAmcContract } from '../../lib/api'

describe('AmcDetail', () => {
  it('shows contract details', async () => {
    getAmcContract.mockResolvedValue({
      data: {
        id: 'a1', contract_number: 'AMC-001', contract_type: 'comprehensive',
        start_date: '2026-01-01', end_date: '2026-12-31', monthly_fee: 5000,
        status: 'active', coverage_notes: 'All parts covered',
        customers: { name: 'Acme Corp' },
      },
      error: null,
    })
    render(
      <MemoryRouter initialEntries={['/contracts/a1']}>
        <Routes>
          <Route path="/contracts/:id" element={<AmcDetail />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('AMC-001')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('All parts covered')).toBeInTheDocument()
    })
  })
})
