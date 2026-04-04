import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createElevator, getElevator, updateElevator } from '../../lib/api'

const inputStyle = {
  width: '100%', border: '1px solid #D4AF37', backgroundColor: '#FFFFFF',
  color: '#2C2C2C', padding: '8px 12px', fontSize: 14, outline: 'none',
}
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#2C2C2C', marginBottom: 4 }
const hintStyle = { fontSize: 11, color: '#888888', marginTop: 4 }

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
    elevator_type: '', capacity: '', floors_served: '',
    status: 'active', turnover_date: '',
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
          capacity: data.capacity || '',
          floors_served: data.floors_served || '',
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
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#2C2C2C' }}>
        {isEdit ? 'Edit Elevator' : 'New Elevator'}
      </h1>

      <form onSubmit={handleSubmit}
        style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24 }}
        className="space-y-4">

        <div>
          <label style={labelStyle}>Unit Number / Name *</label>
          <input name="unit_number" value={form.unit_number} onChange={handleChange} required
            placeholder="e.g. Elevator 1, Unit A, Car 2" style={inputStyle} />
        </div>

        {/* Capacity + Floors served */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Capacity</label>
            <input name="capacity" value={form.capacity} onChange={handleChange}
              placeholder="e.g. 1000 kg / 13 pax" style={inputStyle} />
            <p style={hintStyle}>Load capacity of this unit</p>
          </div>
          <div>
            <label style={labelStyle}>Floors Served</label>
            <input name="floors_served" value={form.floors_served} onChange={handleChange}
              placeholder="e.g. B1–20F or 1–10" style={inputStyle} />
            <p style={hintStyle}>Floor range this elevator covers</p>
          </div>
        </div>

        {/* Brand + Model */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Brand</label>
            <input name="brand" value={form.brand} onChange={handleChange}
              placeholder="e.g. Mitsubishi" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Model</label>
            <input name="model" value={form.model} onChange={handleChange}
              placeholder="e.g. Elenessa" style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Serial Number</label>
          <input name="serial_number" value={form.serial_number} onChange={handleChange}
            style={inputStyle} />
        </div>

        {/* Type + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Type</label>
            <input name="elevator_type" value={form.elevator_type} onChange={handleChange}
              placeholder="e.g. Passenger, Cargo" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
              <option value="active">Active</option>
              <option value="under_warranty">Under Warranty</option>
              <option value="under_free_maintenance">Under Free Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>
            Turnover Date{' '}
            <span style={{ fontSize: 11, color: '#888888', fontWeight: 400 }}>(auto-sets warranty &amp; free maintenance)</span>
          </label>
          <input name="turnover_date" type="date" value={form.turnover_date} onChange={handleChange}
            style={inputStyle} />
        </div>

        {form.warranty_expiry && (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E0C8', padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <p style={{ fontSize: 11, color: '#888888', fontWeight: 600 }}>WARRANTY EXPIRY</p>
              <p style={{ fontSize: 13, color: '#2C2C2C', fontWeight: 600 }}>{form.warranty_expiry}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#888888', fontWeight: 600 }}>FREE MAINTENANCE END</p>
              <p style={{ fontSize: 13, color: '#2C2C2C', fontWeight: 600 }}>{form.free_maintenance_end}</p>
            </div>
          </div>
        )}

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
