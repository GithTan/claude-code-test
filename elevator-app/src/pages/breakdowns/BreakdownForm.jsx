import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createBreakdown, getAllElevators, getBreakdown, updateBreakdown } from '../../lib/api'

export default function BreakdownForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [elevators, setElevators] = useState([])
  const [form, setForm] = useState({
    elevator_id: '', reported_date: new Date().toISOString().split('T')[0],
    reported_by: '', priority: 'medium', description: '',
    status: 'open', technician_name: '', resolved_date: '', resolution_notes: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAllElevators().then(({ data }) => setElevators(data || []))
    if (isEdit) {
      getBreakdown(id).then(({ data }) => {
        if (data) setForm({
          elevator_id: data.elevator_id,
          reported_date: data.reported_date,
          reported_by: data.reported_by || '',
          priority: data.priority,
          description: data.description || '',
          status: data.status,
          technician_name: data.technician_name || '',
          resolved_date: data.resolved_date || '',
          resolution_notes: data.resolution_notes || '',
        })
      })
    }
  }, [id, isEdit])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload = {
      ...form,
      resolved_date: form.resolved_date || null,
    }
    const { data, error: err } = isEdit
      ? await updateBreakdown(id, payload)
      : await createBreakdown(payload)
    setSaving(false)
    if (err) { setError(err.message); return }
    navigate('/breakdowns')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{isEdit ? 'Edit Breakdown' : 'Log Breakdown Call'}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label htmlFor="elevator_id" className="block text-sm font-medium text-gray-700 mb-1">Elevator *</label>
          <select id="elevator_id" name="elevator_id" value={form.elevator_id} onChange={handleChange} required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Select elevator —</option>
            {elevators.map(e => (
              <option key={e.id} value={e.id}>
                {e.buildings?.customers?.name} — {e.buildings?.name} — {e.unit_number}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="reported_date" className="block text-sm font-medium text-gray-700 mb-1">Date Reported *</label>
            <input id="reported_date" name="reported_date" type="date" value={form.reported_date} onChange={handleChange} required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select id="priority" name="priority" value={form.priority} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="reported_by" className="block text-sm font-medium text-gray-700 mb-1">Reported By</label>
          <input id="reported_by" name="reported_by" value={form.reported_by} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="technician_name" className="block text-sm font-medium text-gray-700 mb-1">Assigned Technician</label>
          <input id="technician_name" name="technician_name" value={form.technician_name} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select id="status" name="status" value={form.status} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        {form.status === 'resolved' && (
          <>
            <div>
              <label htmlFor="resolved_date" className="block text-sm font-medium text-gray-700 mb-1">Resolved Date</label>
              <input id="resolved_date" name="resolved_date" type="date" value={form.resolved_date} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="resolution_notes" className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
              <textarea id="resolution_notes" name="resolution_notes" value={form.resolution_notes} onChange={handleChange} rows={2}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
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
