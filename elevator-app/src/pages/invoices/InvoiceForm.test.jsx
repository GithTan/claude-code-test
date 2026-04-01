import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import InvoiceForm from './InvoiceForm'

vi.mock('../../lib/api', () => ({
  createInvoice: vi.fn(),
  createInvoiceItem: vi.fn(),
  getInvoice: vi.fn(),
  updateInvoice: vi.fn(),
  getCustomers: vi.fn(),
}))

import { createInvoice, createInvoiceItem, getCustomers } from '../../lib/api'

describe('InvoiceForm (new)', () => {
  it('renders required fields', async () => {
    getCustomers.mockResolvedValue({ data: [{ id: 'c1', name: 'Acme Corp' }], error: null })
    render(
      <MemoryRouter initialEntries={['/invoices/new']}>
        <Routes>
          <Route path="/invoices/new" element={<InvoiceForm />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByLabelText(/invoice number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/customer/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/issue date/i)).toBeInTheDocument()
    })
  })

  it('calls createInvoice on submit', async () => {
    getCustomers.mockResolvedValue({ data: [{ id: 'c1', name: 'Acme Corp' }], error: null })
    createInvoice.mockResolvedValue({ data: { id: 'i1' }, error: null })
    createInvoiceItem.mockResolvedValue({ data: { id: 'li1' }, error: null })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/invoices/new']}>
        <Routes>
          <Route path="/invoices/new" element={<InvoiceForm />} />
          <Route path="/invoices/:id" element={<div>detail</div>} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => screen.getByLabelText(/invoice number/i))
    await user.type(screen.getByLabelText(/invoice number/i), 'INV-001')
    await user.selectOptions(screen.getByLabelText(/customer/i), 'c1')
    await user.type(screen.getByLabelText(/issue date/i), '2026-04-01')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(createInvoice).toHaveBeenCalledWith(expect.objectContaining({ invoice_number: 'INV-001' }))
    })
  })
})
