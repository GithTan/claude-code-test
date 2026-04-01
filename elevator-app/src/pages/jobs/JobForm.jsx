import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createJob, getJob, updateJob, updateMaintenanceSchedule, getAllMaintenanceSchedules } from '../../lib/api'

function advanceDate(dateStr, visitType) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (visitType === 'monthly') d.setMonth(d.getMonth() + 1)
  else if (visitType === 'quarterly') d.setMonth(d.getMonth() + 3)
  else if (visitType === 'annual') d.setFullYear(d.getFullYear() + 1)
  else return null // adhoc — do not advance
  return d.toISOString().split('T')[0]
}

export default function JobForm() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(jobId)

  const [schedules, setSchedules] = useState([])
  const [form, setForm] = useState({
    schedule_id: '',
    elevator_id: '',
    technician_name: '',
    scheduled_date: '',
    completed_date: '',
    status: 'scheduled',
    notes: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAllMaintenanceSchedules().then(({ data }) => setSchedules(data || []))
    if (isEdit) {
      getJob(jobId).then(({ data }) => {
        if (data) setForm({
          schedule_id: data.schedule_id || '',
          elevator_id: data.elevator_id || '',
          technician_name: data.technician_name || '',
          scheduled_date: data.scheduled_date || '',
          completed_date: data.completed_date || '',
          status: data.status || 'scheduled',
          notes: data.notes || '',
        })
      })
    }
  }, [jobId, isEdit])

  function handleChange(e) {
    const { name, value } = e.target
    if (name === 'schedule_id') {
      const s = schedules.find(s => s.id === value)
      setForm(f => ({ ...f, schedule_id: value, elevator_id: s?.elevator_id || '' }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      schedule_id: form.schedule_id || null,
      elevator_id: form.elevator_id || null,
      technician_name: form.technician_name,
      scheduled_date: form.scheduled_date,
      completed_date: form.completed_date || null,
      status: form.status,
      notes: form.notes || null,
    }

    const { data, error } = isEdit
      ? await updateJob(jobId, payload)
      : await createJob(payload)

    if (error) { setError(error.message); setSaving(false); return }

    // If completed and has a schedule, advance next_due_date
    if (form.status === 'completed' && form.schedule_id && form.completed_date) {
      const s = schedules.find(s => s.id === form.schedule_id)
      const nextDate = advanceDate(form.completed_date, s?.visit_type)
      if (nextDate) {
        await updateMaintenanceSchedule(form.schedule_id, { next_due_date: nextDate })
      }
    }

    setSaving(false)
    navigate('/jobs')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Job' : 'New Job'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label htmlFor="schedule_id" className="block text-sm font-medium text-gray-700 mb-1">
            Elevator / Schedule
          </label>
          <select id="schedule_id" name="schedule_id" value={form.schedule_id} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Select —</option>
            {schedules.map(s => (
              <option key={s.id} value={s.id}>
                {s.elevators?.buildings?.customers?.name} — {s.elevators?.buildings?.name} — {s.elevators?.unit_number} ({s.visit_type})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="technician_name" className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
          <input id="technician_name" name="technician_name" value={form.technician_name} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date *</label>
          <input id="scheduled_date" name="scheduled_date" type="date" value={form.scheduled_date} onChange={handleChange} required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select id="status" name="status" value={form.status} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        {form.status === 'completed' && (
          <div>
            <label htmlFor="completed_date" className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
            <input id="completed_date" name="completed_date" type="date" value={form.completed_date} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

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
