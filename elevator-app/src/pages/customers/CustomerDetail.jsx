import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCustomer, getBuildings } from '../../lib/api'

export default function CustomerDetail() {
  const { id } = useParams()
  const [customer, setCustomer] = useState(null)
  const [buildings, setBuildings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCustomer(id), getBuildings(id)]).then(([c, b]) => {
      setCustomer(c.data)
      setBuildings(b.data || [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <p className="text-gray-500">Loading...</p>
  if (!customer) return <p className="text-red-500">Customer not found.</p>

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link to="/customers" className="text-sm text-blue-600 hover:underline">← Customers</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">{customer.name}</h1>
        </div>
        <Link to={`/customers/${id}/edit`} className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200">
          Edit
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-gray-500">Contact Person</span><p className="font-medium">{customer.contact_person || '—'}</p></div>
        <div><span className="text-gray-500">Phone</span><p className="font-medium">{customer.phone || '—'}</p></div>
        <div><span className="text-gray-500">Email</span><p className="font-medium">{customer.email || '—'}</p></div>
        <div><span className="text-gray-500">Address</span><p className="font-medium">{customer.address || '—'}</p></div>
      </div>

      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-700">Buildings</h2>
        <Link to={`/customers/${id}/buildings/new`}
          className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm">
          Add Building
        </Link>
      </div>

      {buildings.length === 0 ? (
        <p className="text-gray-500 text-sm">No buildings yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Building</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floors</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {buildings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{b.name}</td>
                  <td className="px-6 py-4 text-gray-600">{b.address || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{b.floors || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/buildings/${b.id}/elevators`} className="text-blue-600 hover:underline text-sm">
                      View Elevators
                    </Link>
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
