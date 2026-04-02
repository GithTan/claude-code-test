import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllElevators } from '../../lib/api'

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  under_repair: 'bg-red-100 text-red-800',
}

export default function AllElevatorList() {
  const [elevators, setElevators] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllElevators().then(({ data }) => {
      setElevators(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-gray-500">Loading...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Elevators</h1>
      </div>

      {elevators.length === 0 ? (
        <p className="text-gray-500">No elevators yet. Add them via Customers → Building → Add Elevator.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Building</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand / Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warranty Expiry</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {elevators.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{e.unit_number}</td>
                  <td className="px-6 py-4 text-gray-600">{e.buildings?.customers?.name || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{e.buildings?.name || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{[e.brand, e.model].filter(Boolean).join(' ') || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[e.status] || 'bg-gray-100 text-gray-800'}`}>
                      {e.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{e.warranty_expiry || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/elevators/${e.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
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
