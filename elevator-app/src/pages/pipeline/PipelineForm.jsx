// elevator-app/src/pages/pipeline/PipelineForm.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getProjects, createPipeline, createPipelineSteps, logActivity,
  PROJECT_TYPES,
} from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

export default function PipelineForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({
    project_id: '',
    project_type: 'new_installation',
    supplier: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getProjects().then(({ data }) => setProjects(data || []))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.project_id || !form.supplier.trim()) {
      setError('All fields are required.')
      return
    }
    setSaving(true)
    const { data: pipeline, error: pErr } = await createPipeline({
      ...form,
      created_by: user.id,
    })
    if (pErr) { setError(pErr.message); setSaving(false); return }

    const { error: sErr } = await createPipelineSteps(pipeline.id)
    if (sErr) { setError(sErr.message); setSaving(false); return }

    await logActivity(pipeline.id, null, 'pipeline_created', 'Pipeline created', {
      project_type: form.project_type,
      supplier: form.supplier,
    })

    navigate(`/pipeline/${pipeline.id}`)
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Start New Pipeline</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Installation Project
          </label>
          <select
            value={form.project_id}
            onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a project…</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.project_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Type
          </label>
          <select
            value={form.project_type}
            onChange={e => setForm(f => ({ ...f, project_type: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PROJECT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supplier
          </label>
          <input
            type="text"
            value={form.supplier}
            onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
            placeholder="e.g. KONE Philippines"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Start Pipeline'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/pipeline')}
            className="text-gray-600 px-5 py-2 rounded border border-gray-300 hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
