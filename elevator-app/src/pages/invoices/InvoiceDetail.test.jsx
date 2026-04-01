import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import InvoiceDetail from './InvoiceDetail'

vi.mock('../../lib/api', () => ({
  getInvoice: vi.fn(),
  createPayment: vi.fn(),
  updateInvoice: vi.fn(),
}))

import { getInvoice } from '../../lib/api'

const mockInvoice = {
  id: 'i1',
  invoice_number: 'INV-001',
  invoice_type: 'maintenance',
  issue_date: '2026-04-01',
  due_date: '2026-04-30',
  total_amount: 5000,
  status: 'unpaid',
  notes: '',
  customers: { name: 'Acme Corp' },
  invoice_items: [{ id: 'li1', description: 'Monthly PM', amount: 5000 }],
  payments: [],
  jobs: null,
}

describe('InvoiceDetail', () => {
  it('shows invoice number, customer, and line items', async () => {
    getInvoice.mockResolvedValue({ data: mockInvoice, error: null })
    render(
      <MemoryRouter initialEntries={['/invoices/i1']}>
        <Routes>
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('Monthly PM')).toBeInTheDocument()
    })
  })

  it('shows outstanding balance', async () => {
    getInvoice.mockResolvedValue({ data: mockInvoice, error: null })
    render(
      <MemoryRouter initialEntries={['/invoices/i1']}>
        <Routes>
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText(/outstanding/i)).toBeInTheDocument()
    })
  })
})
