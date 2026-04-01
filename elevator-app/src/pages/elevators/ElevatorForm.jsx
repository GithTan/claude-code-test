import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createElevator, getElevator, updateElevator } from '../../lib/api'

function addOneYear(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

export default function ElevatorForm() {
  const { buildingId, elevatorId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(elevatorId)

  const [form, setForm] = useState({
    unit_number: '', brand: '', model: '', serial_number: '',
    elevator_type: '', status: 'active', turnover_date: '',
    warranty_expiry: '', free_maintenance_end: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit) {
      getElevator(elevatorId).then(({ data }) => {
        if (data) setForm({
          unit_number: data.unit_number,
          brand: data.brand || '',
          model: data.model || '',
          serial_number: data.serial_number || '',
          elevator_type: data.elevator_type || '',
          status: data.status || 'active',
          turnover_date: data.turnover_date || '',
          warranty_expiry: data.warranty_expiry || '',
          free_maintenance_end: data.free_maintenance_end || '',
        })
      })
    }
  }, [elevatorId, isEdit])

  function handleChange(e) {
    const { name, value } = e.target
    if (name === 'turnover_date') {
      setForm(f => ({
        ...f,
        turnover_date: value,
        warranty_expiry: addOneYear(value),
        free_maintenance_end: addOneYear(value),
      }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload = {
      ...form,
      turnover_date: form.turnover_date || null,
      warranty_expiry: form.warranty_expiry || null,
      free_maintenance_end: form.free_maintenance_end || null,
    }
    const { data, error } = isEdit
      ? await updateElevator(elevatorId, payload)
      : await createElevator({ ...payload, building_id: buildingId })
    setSaving(false)
    if (error) { setError(error.message); return }
    navigate(`/elevators/${data.id}`)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Elevator' : 'New Elevator'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label htmlFor="unit_number" className="block text-sm font-medium text-gray-700 mb-1">Unit Number *</label>
          <input id="unit_number" name="unit_number" value={form.unit_number} onChange={handleChange} required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <input id="brand" name="brand" value={form.brand} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input id="model" name="model" value={form.model} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label htmlFor="serial_number" className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
          <input id="serial_number" name="serial_number" value={form.serial_number} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="elevator_type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <input id="elevator_type" name="elevator_type" value={form.elevator_type} onChange={handleChange}
              placeholder="e.g. Passenger, Cargo"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="status" name="status" value={form.status} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="active">Active</option>
              <option value="under_warranty">Under Warranty</option>
              <option value="under_free_maintenance">Under Free Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="turnover_date" className="block text-sm font-medium text-gray-700 mb-1">
            Turnover Date <span className="text-gray-400 font-normal">(auto-sets warranty &amp; free maintenance)</span>
          </label>
          <input id="turnover_date" name="turnover_date" type="date" value={form.turnover_date} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {form.warranty_expiry && (
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 rounded p-3">
            <div><span className="font-medium">Warranty Expiry:</span> {form.warranty_expiry}</div>
            <div><span className="font-medium">Free Maintenance End:</span> {form.free_maintenance_end}</div>
          </div>
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
