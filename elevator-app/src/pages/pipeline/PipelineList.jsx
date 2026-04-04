// elevator-app/src/pages/pipeline/PipelineList.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPipelines, PIPELINE_STAGES, PIPELINE_STEPS, PROJECT_TYPES } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

const PROJECT_TYPE_LABELS = Object.fromEntries(PROJECT_TYPES.map(t => [t.value, t.label]))
const STEP_LABELS = Object.fromEntries(PIPELINE_STEPS.map(s => [s.number, s.label]))
const STEP_ROLES = Object.fromEntries(PIPELINE_STEPS.map(s => [s.number, s.role]))

function daysSince(dateStr) {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}

function getStageIndex(currentStep) {
  return PIPELINE_STAGES.findIndex(s => s.steps.includes(currentStep))
}

function cardColor(pipeline) {
  const step = pipeline.pipeline_steps?.find(s => s.step_number === pipeline.current_step)
  if (!step || step.status !== 'unlocked') return 'border-gray-200'
  const days = daysSince(step.unlocked_at)
  if (days >= 7) return 'border-red-400 bg-red-50'
  if (days >= 3) return 'border-yellow-400 bg-yellow-50'
  return 'border-blue-200 bg-white'
}

function PipelineCard({ pipeline }) {
  const step = pipeline.pipeline_steps?.find(s => s.step_number === pipeline.current_step)
  const days = step ? daysSince(step.unlocked_at) : 0

  return (
    <Link to={`/pipeline/${pipeline.id}`}
      className={`block border rounded-lg p-3 hover:shadow-md transition-shadow ${cardColor(pipeline)}`}>
      <p className="font-semibold text-gray-800 text-sm truncate">
        {pipeline.installation_projects?.name || '—'}
      </p>
      <p className="text-xs text-gray-500 truncate">
        {pipeline.installation_projects?.customers?.name || '—'}
      </p>
      <p className="text-xs text-gray-500 mt-1">{pipeline.supplier}</p>
      <div className="mt-2">
        <span className="text-xs font-medium text-gray-600">
          {PROJECT_TYPE_LABELS[pipeline.project_type] || pipeline.project_type}
        </span>
      </div>
      <div className="mt-2 text-xs text-gray-700 font-medium">
        Step {pipeline.current_step}: {STEP_LABELS[pipeline.current_step] || 'Complete'}
      </div>
      {days >= 3 && (
        <p className={`text-xs mt-1 font-semibold ${days >= 7 ? 'text-red-600' : 'text-yellow-600'}`}>
          {days}d waiting
        </p>
      )}
    </Link>
  )
}

export default function PipelineList() {
  const { role, user } = useAuth()
  const [pipelines, setPipelines] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    getPipelines().then(({ data }) => {
      setPipelines(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-gray-500">Loading…</p>

  const active = pipelines.filter(p => p.status !== 'completed')
  const filtered = filterType === 'all' ? active : active.filter(p => p.project_type === filterType)

  // "Needs Your Action" — steps unlocked and assigned to current user's role
  const mySteps = pipelines.flatMap(p =>
    (p.pipeline_steps || [])
      .filter(s => s.status === 'unlocked' && (role === 'admin' || STEP_ROLES[s.step_number] === role))
      .map(s => ({ ...s, pipeline: p }))
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Project Pipeline</h1>
        <div className="flex gap-3 items-center">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Types</option>
            {PROJECT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {role === 'admin' && (
            <Link to="/pipeline/new"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
              New Pipeline
            </Link>
          )}
        </div>
      </div>

      {/* Needs Your Action */}
      {mySteps.length > 0 && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="font-semibold text-blue-800 mb-3">Needs Your Action ({mySteps.length})</h2>
          <div className="space-y-2">
            {mySteps.map(s => (
              <Link key={s.id} to={`/pipeline/${s.pipeline.id}`}
                className="flex items-center justify-between bg-white rounded p-3 border border-blue-100 hover:shadow-sm">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {s.pipeline.installation_projects?.name} — Step {s.step_number}: {STEP_LABELS[s.step_number]}
                  </p>
                  <p className="text-xs text-gray-500">Waiting {daysSince(s.unlocked_at)}d</p>
                </div>
                <span className="text-blue-600 text-xs font-medium">Open →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div className="grid grid-cols-5 gap-4">
        {PIPELINE_STAGES.map((stage, idx) => {
          const stageProjects = filtered.filter(p => getStageIndex(p.current_step) === idx)
          return (
            <div key={stage.label} className="min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stage.label}</h3>
                <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2">{stageProjects.length}</span>
              </div>
              <div className="space-y-2">
                {stageProjects.map(p => <PipelineCard key={p.id} pipeline={p} />)}
                {stageProjects.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Empty</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Completed */}
      {pipelines.filter(p => p.status === 'completed').length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Completed ({pipelines.filter(p => p.status === 'completed').length})
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {pipelines.filter(p => p.status === 'completed').map(p => (
              <Link key={p.id} to={`/pipeline/${p.id}`}
                className="block border border-green-200 bg-green-50 rounded-lg p-3 hover:shadow-sm">
                <p className="font-semibold text-gray-800 text-sm">{p.installation_projects?.name}</p>
                <p className="text-xs text-green-700 font-medium mt-1">All 12 steps complete</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
