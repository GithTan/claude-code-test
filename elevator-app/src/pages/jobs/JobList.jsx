import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJobs } from '../../lib/api'

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
}

export default function JobList() {
  const [jobs, setJobs] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getJobs().then(({ data }) => {
      setJobs(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-gray-500">Loading...</p>

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Jobs</h1>
        <div className="flex gap-3 items-center">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <Link to="/jobs/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
            Add Job
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">No jobs found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Elevator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visit Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(j => (
                <tr key={j.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{j.scheduled_date}</td>
                  <td className="px-6 py-4 text-gray-600">{j.elevators?.buildings?.customers?.name || '—'}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{j.elevators?.unit_number || '—'}</td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{j.maintenance_schedules?.visit_type || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{j.technician_name || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[j.status] || 'bg-gray-100 text-gray-800'}`}>
                      {j.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/jobs/${j.id}/edit`} className="text-blue-600 hover:underline text-sm">Edit</Link>
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
