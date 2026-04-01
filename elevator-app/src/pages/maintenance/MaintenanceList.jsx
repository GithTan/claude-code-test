import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllMaintenanceSchedules } from '../../lib/api'

export default function MaintenanceList() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllMaintenanceSchedules().then(({ data }) => {
      setSchedules(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-gray-500">Loading...</p>

  const today = new Date()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Maintenance Schedule</h1>

      {schedules.length === 0 ? (
        <p className="text-gray-500">No maintenance schedules found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Building</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Elevator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visit Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Due Date</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.map(s => {
                const isOverdue = s.next_due_date && new Date(s.next_due_date) < today
                return (
                  <tr key={s.id} className={isOverdue ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 text-gray-900">{s.elevators?.buildings?.customers?.name || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{s.elevators?.buildings?.name || '—'}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{s.elevators?.unit_number || '—'}</td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{s.visit_type}</td>
                    <td className={`px-6 py-4 font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                      {s.next_due_date || '—'} {isOverdue && <span className="text-xs">(Overdue)</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/maintenance/${s.id}/edit`} className="text-blue-600 hover:underline text-sm">Edit</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
