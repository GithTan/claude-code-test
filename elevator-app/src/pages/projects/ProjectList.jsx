import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProjects } from '../../lib/api'

const STATUS_COLORS = {
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-yellow-100 text-yellow-900',
  cancelled: 'bg-gray-100 text-gray-800',
}

export default function ProjectList() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProjects().then(({ data }) => {
      setProjects(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-gray-500">Loading...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Installation Projects</h1>
        <Link to="/projects/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-gray-500">No projects yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.project_name}</td>
                  <td className="px-6 py-4 text-gray-600">{p.customers?.name || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-800'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/projects/${p.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
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
