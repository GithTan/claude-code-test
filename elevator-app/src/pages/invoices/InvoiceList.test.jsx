import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import InvoiceList from './InvoiceList'

vi.mock('../../lib/api', () => ({
  getInvoices: vi.fn(),
}))

import { getInvoices } from '../../lib/api'

describe('InvoiceList', () => {
  it('shows invoices after loading', async () => {
    getInvoices.mockResolvedValue({
      data: [
        { id: 'i1', invoice_number: 'INV-001', invoice_type: 'maintenance', issue_date: '2026-04-01', due_date: '2026-04-30', total_amount: 5000, status: 'unpaid', customers: { name: 'Acme Corp' } },
      ],
      error: null,
    })
    render(<MemoryRouter><InvoiceList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })
  })

  it('shows empty state when no invoices', async () => {
    getInvoices.mockResolvedValue({ data: [], error: null })
    render(<MemoryRouter><InvoiceList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/no invoices/i)).toBeInTheDocument()
    })
  })

  it('shows New Invoice button', async () => {
    getInvoices.mockResolvedValue({ data: [], error: null })
    render(<MemoryRouter><InvoiceList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /new invoice/i })).toBeInTheDocument()
    })
  })
})
