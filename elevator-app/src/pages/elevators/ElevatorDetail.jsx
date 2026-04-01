import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getElevator, getMaintenanceSchedules } from '../../lib/api'

export default function ElevatorDetail() {
  const { id } = useParams()
  const [elevator, setElevator] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getElevator(id), getMaintenanceSchedules(id)]).then(([e, s]) => {
      setElevator(e.data)
      setSchedules(s.data || [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <p className="text-gray-500">Loading...</p>
  if (!elevator) return <p className="text-red-500">Elevator not found.</p>

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link to={`/buildings/${elevator.building_id}/elevators`} className="text-sm text-blue-600 hover:underline">
            ← Elevators
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">{elevator.unit_number}</h1>
        </div>
        <Link to={`/elevators/${id}/edit`}
          className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200">
          Edit
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-gray-500">Brand</span><p className="font-medium">{elevator.brand || '—'}</p></div>
        <div><span className="text-gray-500">Model</span><p className="font-medium">{elevator.model || '—'}</p></div>
        <div><span className="text-gray-500">Serial Number</span><p className="font-medium">{elevator.serial_number || '—'}</p></div>
        <div><span className="text-gray-500">Type</span><p className="font-medium">{elevator.elevator_type || '—'}</p></div>
        <div><span className="text-gray-500">Status</span><p className="font-medium capitalize">{elevator.status?.replace(/_/g, ' ')}</p></div>
        <div><span className="text-gray-500">Turnover Date</span><p className="font-medium">{elevator.turnover_date || '—'}</p></div>
        <div><span className="text-gray-500">Warranty Expiry</span><p className="font-medium">{elevator.warranty_expiry || '—'}</p></div>
        <div><span className="text-gray-500">Free Maintenance End</span><p className="font-medium">{elevator.free_maintenance_end || '—'}</p></div>
      </div>

      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-700">Maintenance Schedules</h2>
        <Link to={`/elevators/${id}/maintenance/new`}
          className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm">
          Add Schedule
        </Link>
      </div>

      {schedules.length === 0 ? (
        <p className="text-gray-500 text-sm">No schedules yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visit Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Due Date</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.map(s => {
                const isOverdue = s.next_due_date && new Date(s.next_due_date) < new Date()
                return (
                  <tr key={s.id} className={isOverdue ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 font-medium text-gray-900 capitalize">{s.visit_type}</td>
                    <td className={`px-6 py-4 font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                      {s.next_due_date || '—'} {isOverdue && '(Overdue)'}
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
