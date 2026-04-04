// elevator-app/src/pages/pipeline/PipelineForm.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getProjects, createPipeline, createPipelineSteps, logActivity,
  createProject,
} from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

const ELEVATOR_TYPES = [
  { value: 'passenger', label: 'Passenger Elevator' },
  { value: 'home_elevator', label: 'Home Elevator' },
  { value: 'escalator', label: 'Escalator' },
]

const HOME_ELEVATOR_TYPES = [
  { value: 'traction', label: 'Traction Type' },
  { value: 'hydraulic', label: 'Hydraulic Type' },
  { value: 'platform', label: 'Platform Type' },
]

export default function PipelineForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({
    project_id: '',
    elevator_type: 'passenger',
    home_elevator_type: '',
    with_structure: null,
    unit_count: 1,
    project_type: 'new_installation',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Inline new project form
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [savingProject, setSavingProject] = useState(false)

  async function loadProjects() {
    const { data } = await getProjects()
    setProjects(data || [])
  }

  useEffect(() => {
    loadProjects()
  }, [])

  async function handleAddProject() {
    if (!newProjectName.trim()) return
    setSavingProject(true)
    const { data, error: pErr } = await createProject({
      project_name: newProjectName.trim(),
      status: 'active',
    })
    if (pErr) { setSavingProject(false); return }
    await loadProjects()
    setForm(f => ({ ...f, project_id: data.id }))
    setNewProjectName('')
    setShowNewProject(false)
    setSavingProject(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.project_id) { setError('Please select or create a project.'); return }
    if (form.elevator_type === 'home_elevator' && !form.home_elevator_type) {
      setError('Please select a home elevator type.')
      return
    }
    if (form.elevator_type === 'home_elevator' && form.with_structure === null) {
      setError('Please specify if this includes a structure.')
      return
    }

    setSaving(true)
    const { data: pipeline, error: pErr } = await createPipeline({
      project_id: form.project_id,
      elevator_type: form.elevator_type,
      home_elevator_type: form.elevator_type === 'home_elevator' ? form.home_elevator_type : null,
      with_structure: form.elevator_type === 'home_elevator' ? form.with_structure : null,
      unit_count: form.unit_count,
      project_type: 'new_installation',
      supplier: '',
      created_by: user?.id,
    })
    if (pErr) { setError(pErr.message); setSaving(false); return }

    const { error: sErr } = await createPipelineSteps(pipeline.id)
    if (sErr) { setError(sErr.message); setSaving(false); return }

    await logActivity(pipeline.id, null, 'pipeline_created', 'Pipeline created', {
      elevator_type: form.elevator_type,
      unit_count: form.unit_count,
    })

    navigate(`/pipeline/${pipeline.id}`)
  }

  const isHomeElevator = form.elevator_type === 'home_elevator'

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Start New Pipeline</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Installation Project */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Installation Project</label>
            <button type="button" onClick={() => setShowNewProject(v => !v)}
              className="text-xs text-blue-600 hover:underline">
              + Add New Project
            </button>
          </div>

          {showNewProject && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <p className="text-xs font-medium text-blue-800">New Installation Project</p>
              <input
                type="text"
                placeholder="Project name (e.g. SM Aura Tower Block B)"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              />
              <div className="flex gap-2">
                <button type="button" onClick={handleAddProject} disabled={savingProject || !newProjectName.trim()}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50">
                  {savingProject ? 'Saving…' : 'Save Project'}
                </button>
                <button type="button" onClick={() => setShowNewProject(false)}
                  className="text-gray-500 px-3 py-1 rounded text-xs border border-gray-300 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required>
            <option value="">Select a project…</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.project_name}</option>
            ))}
          </select>
        </div>

        {/* Elevator Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Elevator Type</label>
          <div className="grid grid-cols-3 gap-2">
            {ELEVATOR_TYPES.map(t => (
              <button key={t.value} type="button"
                onClick={() => setForm(f => ({ ...f, elevator_type: t.value, home_elevator_type: '', with_structure: null }))}
                className={`py-2 px-3 rounded border text-sm font-medium transition-colors ${
                  form.elevator_type === t.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Home Elevator sub-options */}
        {isHomeElevator && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Home Elevator Type</label>
              <div className="grid grid-cols-3 gap-2">
                {HOME_ELEVATOR_TYPES.map(t => (
                  <button key={t.value} type="button"
                    onClick={() => setForm(f => ({ ...f, home_elevator_type: t.value }))}
                    className={`py-2 px-3 rounded border text-sm font-medium transition-colors ${
                      form.home_elevator_type === t.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Structure</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ value: true, label: 'With Structure' }, { value: false, label: 'No Structure' }].map(opt => (
                  <button key={String(opt.value)} type="button"
                    onClick={() => setForm(f => ({ ...f, with_structure: opt.value }))}
                    className={`py-2 px-3 rounded border text-sm font-medium transition-colors ${
                      form.with_structure === opt.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Number of Units */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Units</label>
          <input
            type="number"
            min="1"
            max="100"
            value={form.unit_count}
            onChange={e => setForm(f => ({ ...f, unit_count: parseInt(e.target.value) || 1 }))}
            className="w-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 text-sm disabled:opacity-50">
            {saving ? 'Creating…' : 'Start Pipeline'}
          </button>
          <button type="button" onClick={() => navigate('/pipeline')}
            className="text-gray-600 px-5 py-2 rounded border border-gray-300 hover:bg-gray-50 text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
