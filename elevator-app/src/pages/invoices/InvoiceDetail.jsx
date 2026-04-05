import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createPayment, getInvoice, updateInvoice } from '../../lib/api'

function fmt(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [payForm, setPayForm] = useState({ amount: '', payment_date: '', payment_method: 'bank_transfer', reference: '' })
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  async function reload() {
    const { data } = await getInvoice(id)
    setInvoice(data)
  }

  useEffect(() => {
    getInvoice(id).then(({ data }) => {
      setInvoice(data)
      setLoading(false)
    })
  }, [id])

  if (loading) return <p className="text-gray-500">Loading...</p>
  if (!invoice) return <p className="text-red-500">Invoice not found.</p>

  const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + Number(p.amount), 0)
  const outstanding = Number(invoice.total_amount) - totalPaid

  async function handlePayment(e) {
    e.preventDefault()
    setPayError('')
    setPaying(true)
    const { error } = await createPayment({ ...payForm, invoice_id: id, amount: parseFloat(payForm.amount) })
    if (error) { setPayError(error.message); setPaying(false); return }

    const newStatus = outstanding - parseFloat(payForm.amount) <= 0 ? 'paid' : 'partially_paid'
    await updateInvoice(id, { status: newStatus })

    setPayForm({ amount: '', payment_date: '', payment_method: 'bank_transfer', reference: '' })
    setPaying(false)
    await reload()
  }

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link to="/invoices" className="text-sm text-blue-600 hover:underline">← Invoices</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">{invoice.invoice_number}</h1>
        </div>
        <Link to={`/invoices/${id}/edit`}
          className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200">
          Edit
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-4 grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-gray-500">Customer</span><p className="font-medium">{invoice.customers?.name}</p></div>
        <div><span className="text-gray-500">Type</span><p className="font-medium capitalize">{invoice.invoice_type}</p></div>
        <div><span className="text-gray-500">Issue Date</span><p className="font-medium">{invoice.issue_date}</p></div>
        <div><span className="text-gray-500">Due Date</span><p className="font-medium">{invoice.due_date || '—'}</p></div>
        <div><span className="text-gray-500">Status</span><p className="font-medium capitalize">{invoice.status?.replace(/_/g, ' ')}</p></div>
        {invoice.notes && <div className="col-span-2"><span className="text-gray-500">Notes</span><p className="font-medium">{invoice.notes}</p></div>}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Line Items</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(invoice.invoice_items || []).map(item => (
              <tr key={item.id}>
                <td className="py-2 text-gray-700">{item.description}</td>
                <td className="py-2 text-right text-gray-900 font-medium">{fmt(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300">
              <td className="py-2 font-bold text-gray-800">Total</td>
              <td className="py-2 text-right font-bold text-gray-800">{fmt(invoice.total_amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Payments</h2>
        {(invoice.payments || []).length === 0 ? (
          <p className="text-gray-500 text-sm mb-3">No payments recorded.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 mb-3">
            <thead>
              <tr>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.payments.map(p => (
                <tr key={p.id}>
                  <td className="py-2 text-gray-700">{p.payment_date}</td>
                  <td className="py-2 text-gray-700 capitalize">{p.payment_method?.replace(/_/g, ' ')}</td>
                  <td className="py-2 text-gray-700">{p.reference || '—'}</td>
                  <td className="py-2 text-right text-gray-900 font-medium">{fmt(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex justify-between text-sm font-semibold border-t pt-2">
          <span className="text-gray-600">Total Paid</span>
          <span>{fmt(totalPaid)}</span>
        </div>
        <div className="flex justify-between text-base font-bold mt-1">
          <span className="text-gray-800">Outstanding</span>
          <span className={outstanding > 0 ? 'text-red-600' : 'text-yellow-700'}>{fmt(outstanding)}</span>
        </div>
      </div>

      {outstanding > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-3">Record Payment</h2>
          <form onSubmit={handlePayment} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input type="number" min="0.01" step="0.01" value={payForm.amount}
                  onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" value={payForm.payment_date}
                  onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))} required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <select value={payForm.payment_method}
                  onChange={e => setPayForm(f => ({ ...f, payment_method: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <input type="text" value={payForm.reference}
                  onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            {payError && <p className="text-red-600 text-sm">{payError}</p>}
            <button type="submit" disabled={paying}
              style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '8px 16px', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              {paying ? 'Recording...' : 'Record Payment'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
