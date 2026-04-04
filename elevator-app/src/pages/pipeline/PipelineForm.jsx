// elevator-app/src/pages/pipeline/PipelineForm.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPipeline, createPipelineSteps, logActivity, createProject } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

const ELEVATOR_TYPES = [
  { value: 'passenger', label: 'Passenger Elevator' },
  { value: 'home_elevator', label: 'Home Elevator' },
  { value: 'escalator', label: 'Escalator' },
]

const HOME_ELEVATOR_TYPES = [
  { value: 'traction', label: 'Traction' },
  { value: 'hydraulic', label: 'Hydraulic' },
  { value: 'platform', label: 'Platform' },
]

export default function PipelineForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    project_name: '',
    elevator_type: 'passenger',
    home_elevator_type: '',
    with_structure: null,
    unit_count: 1,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const isHomeElevator = form.elevator_type === 'home_elevator'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.project_name.trim()) { setError('Please enter a project name.'); return }
    if (isHomeElevator && !form.home_elevator_type) { setError('Please select a home elevator type.'); return }
    if (isHomeElevator && form.with_structure === null) { setError('Please select With or No Structure.'); return }

    setSaving(true)
    setError(null)

    // Create the project first
    const { data: project, error: projErr } = await createProject({
      project_name: form.project_name.trim(),
      status: 'active',
    })
    if (projErr) { setError(projErr.message); setSaving(false); return }

    // Create the pipeline linked to the new project
    const { data: pipeline, error: pErr } = await createPipeline({
      project_id: project.id,
      elevator_type: form.elevator_type,
      home_elevator_type: isHomeElevator ? form.home_elevator_type : null,
      with_structure: isHomeElevator ? form.with_structure : null,
      unit_count: form.unit_count,
      project_type: 'new_installation',
      supplier: '',
      created_by: user?.id,
    })
    if (pErr) { setError(pErr.message); setSaving(false); return }

    await createPipelineSteps(pipeline.id)
    await logActivity(pipeline.id, null, 'pipeline_created', 'Pipeline created', {
      elevator_type: form.elevator_type,
      unit_count: form.unit_count,
    })

    navigate(`/pipeline/${pipeline.id}`)
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Start New Pipeline</h1>

      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
          <input
            type="text"
            placeholder="e.g. SM Aura Tower Block B"
            value={form.project_name}
            onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
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
