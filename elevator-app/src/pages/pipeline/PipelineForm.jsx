// elevator-app/src/pages/pipeline/PipelineForm.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPipeline, createPipelineSteps, createProjectUnits, logActivity, createProject } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

const inputStyle = {
  width: '100%', border: '1px solid #D4AF37', backgroundColor: '#FFFFFF',
  color: '#2C2C2C', padding: '8px 12px', fontSize: 14, outline: 'none',
}
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#2C2C2C', marginBottom: 4 }
const sectionStyle = { backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24 }
const sectionTitle = { fontSize: 13, fontWeight: 700, color: '#2C2C2C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }

const DRIVE_TYPES = [
  { value: 'traction', label: 'Traction Elevator' },
  { value: 'platform', label: 'Platform Elevator' },
  { value: 'hydraulic', label: 'Hydraulic Elevator' },
]
const USE_TYPES = [
  { value: 'passenger', label: 'Passenger' },
  { value: 'service', label: 'Service' },
]

function defaultUnit(n) {
  return {
    unit_number: n,
    unit_label: '',
    is_home_elevator: false,
    drive_type: '',
    use_type: 'passenger',
    with_structure: false,
    brand: '',
    stops: '',
    openings: '',
    floors: '',
  }
}

function UnitCard({ unit, index, onChange, onRemove, canRemove }) {
  const isPlatform = unit.drive_type === 'platform'

  function set(field, value) {
    const updated = { ...unit, [field]: value }
    // Platform always has structure
    if (field === 'drive_type' && value === 'platform') updated.with_structure = true
    onChange(index, updated)
  }

  return (
    <div style={{ border: '1px solid #D4AF37', padding: 20, marginBottom: 12, backgroundColor: '#FFFFFF', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2C' }}>Unit {unit.unit_number}</p>
        {canRemove && (
          <button type="button" onClick={() => onRemove(index)}
            style={{ fontSize: 12, color: '#8B0000', border: '1px solid #8B0000', padding: '3px 8px', background: 'none', cursor: 'pointer' }}>
            Remove
          </button>
        )}
      </div>

      {/* Drive Type */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Drive Type</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {DRIVE_TYPES.map(t => (
            <button key={t.value} type="button" onClick={() => set('drive_type', t.value)}
              style={{
                padding: '8px 6px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                backgroundColor: unit.drive_type === t.value ? '#2C2C2C' : '#FFFFFF',
                color: unit.drive_type === t.value ? '#D4AF37' : '#888888',
                border: `1px solid ${unit.drive_type === t.value ? '#2C2C2C' : '#D4AF37'}`,
              }}>
              {t.label}
            </button>
          ))}
        </div>
        {isPlatform && (
          <p style={{ fontSize: 11, color: '#D4AF37', marginTop: 6, fontWeight: 600 }}>
            Platform elevator always comes as an asset — With Structure is auto-set.
          </p>
        )}
      </div>

      {/* Use Type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Use Type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {USE_TYPES.map(t => (
              <button key={t.value} type="button" onClick={() => set('use_type', t.value)}
                style={{
                  flex: 1, padding: '8px 6px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  backgroundColor: unit.use_type === t.value ? '#D4AF37' : '#FFFFFF',
                  color: unit.use_type === t.value ? '#2C2C2C' : '#888888',
                  border: `1px solid #D4AF37`,
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Structure */}
        <div>
          <label style={labelStyle}>Structure</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ value: true, label: 'With Structure' }, { value: false, label: 'No Structure' }].map(opt => (
              <button key={String(opt.value)} type="button"
                onClick={() => !isPlatform && set('with_structure', opt.value)}
                disabled={isPlatform}
                style={{
                  flex: 1, padding: '8px 6px', fontSize: 12, fontWeight: 600,
                  cursor: isPlatform ? 'not-allowed' : 'pointer',
                  backgroundColor: unit.with_structure === opt.value ? '#D4AF37' : '#FFFFFF',
                  color: unit.with_structure === opt.value ? '#2C2C2C' : isPlatform ? '#CCCCCC' : '#888888',
                  border: `1px solid ${isPlatform ? '#CCCCCC' : '#D4AF37'}`,
                  opacity: isPlatform && !opt.value ? 0.4 : 1,
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Home Elevator toggle */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Home Elevator?</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ value: true, label: 'Yes — Home Elevator' }, { value: false, label: 'No' }].map(opt => (
            <button key={String(opt.value)} type="button" onClick={() => set('is_home_elevator', opt.value)}
              style={{
                padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                backgroundColor: unit.is_home_elevator === opt.value ? '#2C2C2C' : '#FFFFFF',
                color: unit.is_home_elevator === opt.value ? '#D4AF37' : '#888888',
                border: `1px solid ${unit.is_home_elevator === opt.value ? '#2C2C2C' : '#D4AF37'}`,
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brand + Label + Stops/Openings/Floors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Brand</label>
          <input value={unit.brand} onChange={e => set('brand', e.target.value)}
            placeholder="e.g. KONE, Otis, Hyundai" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Unit Label</label>
          <input value={unit.unit_label} onChange={e => set('unit_label', e.target.value)}
            placeholder="e.g. PE1, HE1" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Stops</label>
          <input type="number" min="0" value={unit.stops} onChange={e => set('stops', e.target.value)}
            placeholder="e.g. 4" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Openings</label>
          <input type="number" min="0" value={unit.openings} onChange={e => set('openings', e.target.value)}
            placeholder="e.g. 4" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Floors</label>
          <input type="number" min="0" value={unit.floors} onChange={e => set('floors', e.target.value)}
            placeholder="e.g. 4" style={inputStyle} />
        </div>
      </div>
    </div>
  )
}

function normalizeCase(str) {
  if (!str || typeof str !== 'string') return str
  const s = str.trim()
  const letters = s.replace(/[^a-zA-Z]/g, '')
  if (letters.length === 0) return s
  if (letters !== letters.toUpperCase()) return s
  return s.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

export default function PipelineForm() {
  const { user, role } = useAuth()
  const isAdmin = role === 'admin'
  const navigate = useNavigate()
  const [form, setForm] = useState({
    project_name: '',
    contract_amount: '',
    vat_inclusive: true,
  })
  const [units, setUnits] = useState([defaultUnit(1)])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function updateUnit(index, updated) {
    setUnits(u => u.map((unit, i) => i === index ? updated : unit))
  }

  function addUnit() {
    setUnits(u => [...u, defaultUnit(u.length + 1)])
  }

  function removeUnit(index) {
    setUnits(u => {
      const next = u.filter((_, i) => i !== index)
      return next.map((unit, i) => ({ ...unit, unit_number: i + 1 }))
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.project_name.trim()) { setError('Project Name is required — please enter a name before continuing.'); return }
    if (form.contract_amount && parseFloat(form.contract_amount) > 999999999999999) {
      setError('Contract Amount is too large. Maximum allowed is ₱999,999,999,999,999.')
      return
    }

    setSaving(true)
    setError(null)

    // Create the installation project
    const { data: project, error: projErr } = await createProject({
      project_name: normalizeCase(form.project_name.trim()),
      status: 'active',
      contract_amount: form.contract_amount ? parseFloat(form.contract_amount) : null,
      vat_inclusive: form.vat_inclusive,
    })
    if (projErr) { setError(projErr.message); setSaving(false); return }

    // Create the pipeline
    const firstUnit = units[0]
    const { data: pipeline, error: pErr } = await createPipeline({
      project_id: project.id,
      elevator_type: firstUnit.is_home_elevator ? 'home_elevator' : (firstUnit.use_type || 'passenger'),
      home_elevator_type: firstUnit.is_home_elevator ? (firstUnit.drive_type || null) : null,
      with_structure: firstUnit.with_structure,
      unit_count: units.length,
      project_type: 'new_installation',
      supplier: '',
      created_by: user?.id,
    })
    if (pErr) { setError(pErr.message); setSaving(false); return }

    // Create pipeline steps
    await createPipelineSteps(pipeline.id)

    // Create unit records
    const unitRecords = units.map(u => ({
      pipeline_id: pipeline.id,
      unit_number: u.unit_number,
      unit_label: u.unit_label ? normalizeCase(u.unit_label) : null,
      is_home_elevator: u.is_home_elevator,
      with_structure: u.with_structure,
      drive_type: u.drive_type || null,
      use_type: u.use_type || null,
      brand: u.brand ? normalizeCase(u.brand) : null,
      stops: u.stops ? parseInt(u.stops) : null,
      openings: u.openings ? parseInt(u.openings) : null,
      floors: u.floors ? parseInt(u.floors) : null,
    }))
    await createProjectUnits(unitRecords)

    await logActivity(pipeline.id, null, 'pipeline_created', 'Pipeline created', {
      unit_count: units.length,
      brands: units.map(u => u.brand).filter(Boolean),
    })

    navigate(`/pipeline/${pipeline.id}`)
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#2C2C2C' }}>Start New Pipeline</h1>

      {error && (
        <div style={{ backgroundColor: '#FFF0F0', border: '1px solid #8B0000', padding: '12px 16px', marginBottom: 16 }}>
          <p style={{ color: '#8B0000', fontSize: 13, fontWeight: 600 }}>⚠ {error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Project Info */}
        <div style={sectionStyle}>
          <p style={sectionTitle}>Project Info</p>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Project Name *</label>
            <input value={form.project_name}
              onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))}
              placeholder="e.g. SM Aura Tower Block B" style={inputStyle} required autoFocus />
          </div>

          {isAdmin ? (
            <div>
              <label style={labelStyle}>Contract Amount</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#888888' }}>₱</span>
                <input type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.contract_amount}
                  onChange={e => setForm(f => ({ ...f, contract_amount: e.target.value }))}
                  style={{ ...inputStyle, flex: 1 }} />
                <div style={{ display: 'flex', border: '1px solid #D4AF37', overflow: 'hidden' }}>
                  {[{ label: 'VAT Inc.', v: true }, { label: 'Non-VAT', v: false }].map(opt => (
                    <button key={String(opt.v)} type="button"
                      onClick={() => setForm(f => ({ ...f, vat_inclusive: opt.v }))}
                      style={{
                        padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        backgroundColor: form.vat_inclusive === opt.v ? '#D4AF37' : '#FFFFFF',
                        color: form.vat_inclusive === opt.v ? '#2C2C2C' : '#888888',
                        border: 'none',
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '10px 12px', backgroundColor: '#F0F0F0', border: '1px solid #D4AF37' }}>
              <p style={{ fontSize: 12, color: '#888888' }}>Contract amount — Admin only. You can proceed without it.</p>
            </div>
          )}
        </div>

        {/* Unit Specs */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={sectionTitle}>Unit Specifications</p>
            <span style={{ fontSize: 12, color: '#888888' }}>{units.length} unit{units.length !== 1 ? 's' : ''}</span>
          </div>
          <p style={{ fontSize: 12, color: '#888888', marginBottom: 16, marginTop: -12 }}>
            Each unit can have different specs. Add a unit for each elevator in this project.
          </p>

          {units.map((unit, i) => (
            <UnitCard key={i} unit={unit} index={i}
              onChange={updateUnit}
              onRemove={removeUnit}
              canRemove={units.length > 1} />
          ))}

          <button type="button" onClick={addUnit}
            style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', backgroundColor: '#FFFFFF', color: '#D4AF37', border: '2px dashed #D4AF37' }}>
            + Add Another Unit
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
          <button type="submit" disabled={saving}
            style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '10px 24px', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Creating…' : 'Start Pipeline'}
          </button>
          <button type="button" onClick={() => navigate('/pipeline')}
            style={{ backgroundColor: '#FFFFFF', color: '#2C2C2C', padding: '10px 24px', border: '1px solid #D4AF37', fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
