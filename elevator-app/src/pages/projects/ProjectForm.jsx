import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createMilestone, createProject, deleteMilestone, getCustomers, getProject, updateProject } from '../../lib/api'

export default function ProjectForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({ customer_id: '', project_name: '', status: 'active' })
  const [milestones, setMilestones] = useState([{ category: 'equipment', description: '', amount: '' }])
  const [existingMilestoneIds, setExistingMilestoneIds] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCustomers().then(({ data }) => setCustomers(data || []))
    if (isEdit) {
      getProject(id).then(({ data }) => {
        if (data) {
          setForm({ customer_id: data.customer_id, project_name: data.project_name, status: data.status })
          const ms = data.payment_milestones || []
          setMilestones(ms.map(m => ({ id: m.id, category: m.category, description: m.description, amount: String(m.amount) })))
          setExistingMilestoneIds(ms.map(m => m.id))
        }
      })
    }
  }, [id, isEdit])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleMilestoneChange(index, field, value) {
    setMilestones(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  function addMilestone() {
    setMilestones(prev => [...prev, { category: 'equipment', description: '', amount: '' }])
  }

  function removeMilestone(index) {
    setMilestones(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const { data: proj, error: projErr } = isEdit
      ? await updateProject(id, form)
      : await createProject(form)

    if (projErr) { setError(projErr.message); setSaving(false); return }

    if (isEdit) {
      const currentIds = milestones.filter(m => m.id).map(m => m.id)
      const toDelete = existingMilestoneIds.filter(eid => !currentIds.includes(eid))
      for (const did of toDelete) await deleteMilestone(did)
    }

    for (const m of milestones) {
      if (!m.id && m.description) {
        await createMilestone({ project_id: proj.id, category: m.category, description: m.description, amount: parseFloat(m.amount) || 0 })
      }
    }

    setSaving(false)
    navigate(`/projects/${proj.id}`)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{isEdit ? 'Edit Project' : 'New Installation Project'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label htmlFor="project_name" className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <input id="project_name" name="project_name" value={form.project_name} onChange={handleChange} required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
            <select id="customer_id" name="customer_id" value={form.customer_id} onChange={handleChange} required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Select customer —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="status" name="status" value={form.status} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Payment Milestones</h2>
          <div className="space-y-3">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-2 items-start">
                <select value={m.category} onChange={e => handleMilestoneChange(i, 'category', e.target.value)}
                  className="w-36 border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="equipment">Equipment</option>
                  <option value="installation">Installation</option>
                </select>
                <input value={m.description} onChange={e => handleMilestoneChange(i, 'description', e.target.value)}
                  placeholder="Description"
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={m.amount} onChange={e => handleMilestoneChange(i, 'amount', e.target.value)}
                  placeholder="Amount" type="number" min="0" step="0.01"
                  className="w-36 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {milestones.length > 1 && (
                  <button type="button" onClick={() => removeMilestone(i)}
                    className="text-red-500 hover:text-red-700 px-2 py-2 text-sm">✕</button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addMilestone}
            className="mt-3 text-blue-600 hover:underline text-sm">+ Add milestone</button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
