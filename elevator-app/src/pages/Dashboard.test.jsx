import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from './Dashboard'

vi.mock('../lib/api', () => ({
  getOverdueMaintenance: vi.fn(),
  getJobs: vi.fn(),
  getAllMaintenanceSchedules: vi.fn(),
  getUnpaidInvoices: vi.fn(),
  getOpenBreakdowns: vi.fn(),
  getExpiringAmcContracts: vi.fn(),
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { getOverdueMaintenance, getJobs, getAllMaintenanceSchedules, getUnpaidInvoices, getOpenBreakdowns, getExpiringAmcContracts } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

function mockAll() {
  getOverdueMaintenance.mockResolvedValue({ data: [], error: null })
  getJobs.mockResolvedValue({ data: [], error: null })
  getAllMaintenanceSchedules.mockResolvedValue({ data: [], error: null })
  getUnpaidInvoices.mockResolvedValue({ data: [], error: null })
  getOpenBreakdowns.mockResolvedValue({ data: [], error: null })
  getExpiringAmcContracts.mockResolvedValue({ data: [], error: null })
}

describe('Dashboard', () => {
  it('shows overdue maintenance count', async () => {
    useAuth.mockReturnValue({ role: 'admin' })
    mockAll()
    getOverdueMaintenance.mockResolvedValue({ data: [{ id: 'm1' }, { id: 'm2' }], error: null })
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getAllByText(/overdue/i).length).toBeGreaterThan(0)
    })
  })

  it('shows unpaid invoices total for admin', async () => {
    useAuth.mockReturnValue({ role: 'admin' })
    mockAll()
    getUnpaidInvoices.mockResolvedValue({
      data: [{ id: 'i1', total_amount: 10000 }, { id: 'i2', total_amount: 5000 }],
      error: null,
    })
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/unpaid/i)).toBeInTheDocument()
    })
  })

  it('hides financial stats from operations_manager', async () => {
    useAuth.mockReturnValue({ role: 'operations_manager' })
    mockAll()
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.queryByText(/unpaid invoices/i)).not.toBeInTheDocument()
    })
  })

  it('shows open breakdowns count', async () => {
    useAuth.mockReturnValue({ role: 'operations_manager' })
    mockAll()
    getOpenBreakdowns.mockResolvedValue({ data: [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }], error: null })
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/open breakdown/i)).toBeInTheDocument()
    })
  })
})
