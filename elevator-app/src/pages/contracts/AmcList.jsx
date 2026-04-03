import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAmcContracts } from '../../lib/api'

function fmt(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function expiryBadge(endDate, status) {
  if (status === 'expired' || status === 'cancelled') {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 capitalize">{status}</span>
  }
  const today = new Date()
  const end = new Date(endDate)
  const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 30) {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Expires in {daysLeft}d</span>
  }
  if (daysLeft <= 60) {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Expires in {daysLeft}d</span>
  }
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
}

export default function AmcList() {
  const [contracts, setContracts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAmcContracts().then(({ data }) => {
      setContracts(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-gray-500">Loading...</p>

  const filtered = filter === 'all' ? contracts : contracts.filter(c => c.status === filter)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">AMC Contracts</h1>
        <div className="flex gap-3 items-center">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Link to="/contracts/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
            New Contract
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">No contracts yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monthly Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{c.contract_number}</td>
                  <td className="px-6 py-4 text-gray-600">{c.customers?.name || '—'}</td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{c.contract_type?.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4 text-gray-600">{c.start_date}</td>
                  <td className="px-6 py-4 text-gray-600">{c.end_date}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{fmt(c.monthly_fee)}</td>
                  <td className="px-6 py-4">{expiryBadge(c.end_date, c.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/contracts/${c.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
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
