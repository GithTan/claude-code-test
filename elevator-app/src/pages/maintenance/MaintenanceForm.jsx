import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createMaintenanceSchedule, updateMaintenanceSchedule } from '../../lib/api'
import { supabase } from '../../lib/supabase'

async function getMaintenanceSchedule(id) {
  return supabase.from('maintenance_schedules').select('*').eq('id', id).single()
}

export default function MaintenanceForm() {
  const { elevatorId, scheduleId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(scheduleId)

  const [form, setForm] = useState({ visit_type: 'monthly', next_due_date: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit) {
      getMaintenanceSchedule(scheduleId).then(({ data }) => {
        if (data) setForm({ visit_type: data.visit_type, next_due_date: data.next_due_date || '' })
      })
    }
  }, [scheduleId, isEdit])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload = { ...form, next_due_date: form.next_due_date || null }
    const { data, error } = isEdit
      ? await updateMaintenanceSchedule(scheduleId, payload)
      : await createMaintenanceSchedule({ ...payload, elevator_id: elevatorId })
    setSaving(false)
    if (error) { setError(error.message); return }
    navigate(`/elevators/${data.elevator_id}`)
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Schedule' : 'New Maintenance Schedule'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label htmlFor="visit_type" className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
          <select id="visit_type" name="visit_type" value={form.visit_type} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
            <option value="adhoc">Ad-hoc PM</option>
          </select>
        </div>
        <div>
          <label htmlFor="next_due_date" className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
          <input id="next_due_date" name="next_due_date" type="date" value={form.next_due_date} onChange={handleChange}
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
