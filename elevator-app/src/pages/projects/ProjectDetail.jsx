import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProject, updateMilestone } from '../../lib/api'

function fmt(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

const MILESTONE_STATUS_NEXT = { unbilled: 'billed', billed: 'paid' }
const MILESTONE_STATUS_COLORS = {
  unbilled: 'bg-gray-100 text-gray-700',
  billed: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
}

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  async function reload() {
    const { data } = await getProject(id)
    setProject(data)
  }

  useEffect(() => {
    getProject(id).then(({ data }) => {
      setProject(data)
      setLoading(false)
    })
  }, [id])

  if (loading) return <p className="text-gray-500">Loading...</p>
  if (!project) return <p className="text-red-500">Project not found.</p>

  const milestones = project.payment_milestones || []
  const equipment = milestones.filter(m => m.category === 'equipment')
  const installation = milestones.filter(m => m.category === 'installation')

  async function advanceMilestone(milestone) {
    const next = MILESTONE_STATUS_NEXT[milestone.status]
    if (!next) return
    await updateMilestone(milestone.id, {
      status: next,
      billed_date: next === 'billed' ? new Date().toISOString().split('T')[0] : milestone.billed_date,
      paid_date: next === 'paid' ? new Date().toISOString().split('T')[0] : milestone.paid_date,
    })
    await reload()
  }

  function MilestoneTable({ items }) {
    if (items.length === 0) return <p className="text-gray-500 text-sm">No milestones.</p>
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
            <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(m => (
            <tr key={m.id}>
              <td className="py-2 text-gray-700">{m.description}</td>
              <td className="py-2 text-right font-medium text-gray-900">{fmt(m.amount)}</td>
              <td className="py-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${MILESTONE_STATUS_COLORS[m.status]}`}>
                  {m.status}
                </span>
              </td>
              <td className="py-2 text-right">
                {MILESTONE_STATUS_NEXT[m.status] && (
                  <button onClick={() => advanceMilestone(m)}
                    className="text-blue-600 hover:underline text-xs">
                    Mark as {MILESTONE_STATUS_NEXT[m.status]}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link to="/projects" className="text-sm text-blue-600 hover:underline">← Projects</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">{project.project_name}</h1>
        </div>
        <Link to={`/projects/${id}/edit`}
          className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200">
          Edit
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-4 grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-gray-500">Customer</span><p className="font-medium">{project.customers?.name}</p></div>
        <div><span className="text-gray-500">Status</span><p className="font-medium capitalize">{project.status}</p></div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Equipment / Importation</h2>
        <MilestoneTable items={equipment} />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Installation / Local Materials</h2>
        <MilestoneTable items={installation} />
      </div>
    </div>
  )
}
