import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createBuilding, getBuilding, updateBuilding } from '../../lib/api'

const inputStyle = {
  width: '100%', border: '1px solid #D4AF37', backgroundColor: '#FFFFFF',
  color: '#2C2C2C', padding: '8px 12px', fontSize: 14, outline: 'none',
}
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#2C2C2C', marginBottom: 4 }

export default function BuildingForm() {
  const { customerId, buildingId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(buildingId)

  const [form, setForm] = useState({ name: '', address: '', floors: '', capacity: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit) {
      getBuilding(buildingId).then(({ data }) => {
        if (data) setForm({
          name: data.name,
          address: data.address || '',
          floors: data.floors || '',
          capacity: data.capacity || '',
        })
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
    const { data, error } = isEdit
      ? await updateBuilding(buildingId, payload)
      : await createBuilding({ ...payload, customer_id: customerId })
    setSaving(false)
    if (error) { setError(error.message); return }
    navigate(`/customers/${data.customer_id}`)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#2C2C2C' }}>
        {isEdit ? 'Edit Building' : 'New Building'}
      </h1>

      <form onSubmit={handleSubmit}
        style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24 }}
        className="space-y-4">

        <div>
          <label style={labelStyle}>Building Name *</label>
          <input name="name" value={form.name} onChange={handleChange} required
            placeholder="e.g. SM Aura Tower" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Address</label>
          <textarea name="address" value={form.address} onChange={handleChange} rows={2}
            placeholder="e.g. 26th St., BGC, Taguig" style={inputStyle} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Number of Floors</label>
            <input name="floors" type="number" min="1" value={form.floors} onChange={handleChange}
              placeholder="e.g. 20" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Capacity</label>
            <input name="capacity" value={form.capacity} onChange={handleChange}
              placeholder="e.g. 1000 kg / 13 persons" style={inputStyle} />
          </div>
        </div>

        {error && <p style={{ color: '#8B0000', fontSize: 13 }}>{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '8px 20px', fontWeight: 600, fontSize: 14, opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            style={{ backgroundColor: '#FFFFFF', color: '#2C2C2C', padding: '8px 20px', border: '1px solid #D4AF37', fontSize: 14 }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
