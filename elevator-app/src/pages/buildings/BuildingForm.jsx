import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createBuilding, getBuilding, updateBuilding } from '../../lib/api'

export default function BuildingForm() {
  const { customerId, buildingId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(buildingId)

  const [form, setForm] = useState({ name: '', address: '', floors: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit) {
      getBuilding(buildingId).then(({ data }) => {
        if (data) setForm({ name: data.name, address: data.address || '', floors: data.floors || '' })
      })
    }
  }, [buildingId, isEdit])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload = { ...form, floors: form.floors ? parseInt(form.floors) : null }
    const cid = customerId
    const { data, error } = isEdit
      ? await updateBuilding(buildingId, payload)
      : await createBuilding({ ...payload, customer_id: cid })
    setSaving(false)
    if (error) { setError(error.message); return }
    navigate(`/customers/${data.customer_id}`)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Building' : 'New Building'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Building Name *</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea id="address" name="address" value={form.address} onChange={handleChange} rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="floors" className="block text-sm font-medium text-gray-700 mb-1">Number of Floors</label>
          <input id="floors" name="floors" type="number" min="1" value={form.floors} onChange={handleChange}
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
