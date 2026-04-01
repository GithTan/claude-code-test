import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Reports from './Reports'

vi.mock('../../lib/api', () => ({
  getOverdueMaintenance: vi.fn(),
  getJobsThisMonth: vi.fn(),
  getTechnicianSummary: vi.fn(),
  getElevatorStatusOverview: vi.fn(),
  getUnpaidInvoices: vi.fn(),
  getPaymentHistory: vi.fn(),
  getMonthlyRevenue: vi.fn(),
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { getOverdueMaintenance, getJobsThisMonth, getTechnicianSummary, getElevatorStatusOverview, getUnpaidInvoices, getPaymentHistory, getMonthlyRevenue } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

function mockAllReports() {
  getOverdueMaintenance.mockResolvedValue({ data: [], error: null })
  getJobsThisMonth.mockResolvedValue({ data: [], error: null })
  getTechnicianSummary.mockResolvedValue({ data: [], error: null })
  getElevatorStatusOverview.mockResolvedValue({ data: [], error: null })
  getUnpaidInvoices.mockResolvedValue({ data: [], error: null })
  getPaymentHistory.mockResolvedValue({ data: [], error: null })
  getMonthlyRevenue.mockResolvedValue({ data: [], error: null })
}

describe('Reports', () => {
  it('shows operational reports for both roles', async () => {
    useAuth.mockReturnValue({ role: 'operations_manager' })
    mockAllReports()
    render(<MemoryRouter><Reports /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/overdue maintenance/i)).toBeInTheDocument()
      expect(screen.getByText(/jobs completed/i)).toBeInTheDocument()
    })
  })

  it('shows financial reports for admin only', async () => {
    useAuth.mockReturnValue({ role: 'admin' })
    mockAllReports()
    render(<MemoryRouter><Reports /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/unpaid invoices/i)).toBeInTheDocument()
    })
  })

  it('hides financial reports from operations_manager', async () => {
    useAuth.mockReturnValue({ role: 'operations_manager' })
    mockAllReports()
    render(<MemoryRouter><Reports /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.queryByText(/unpaid invoices/i)).not.toBeInTheDocument()
    })
  })
})
