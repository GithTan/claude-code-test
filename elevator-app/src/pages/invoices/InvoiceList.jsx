import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getInvoices } from '../../lib/api'

const STATUS_COLORS = {
  unpaid: 'bg-red-100 text-red-800',
  partially_paid: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
}

function fmt(amount) {
  return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getInvoices().then(({ data }) => {
      setInvoices(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-gray-500">Loading...</p>

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
        <div className="flex gap-3 items-center">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
          </select>
          <Link to="/invoices/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
            New Invoice
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">No invoices yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{inv.invoice_number}</td>
                  <td className="px-6 py-4 text-gray-600">{inv.customers?.name || '—'}</td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{inv.invoice_type}</td>
                  <td className="px-6 py-4 text-gray-600">{inv.issue_date}</td>
                  <td className="px-6 py-4 text-gray-600">{inv.due_date || '—'}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{fmt(inv.total_amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-800'}`}>
                      {inv.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/invoices/${inv.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
