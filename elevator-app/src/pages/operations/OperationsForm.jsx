import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  createOpsProject, getOpsProject, updateOpsProject, deleteOpsProject,
  requestDeletion, createAmcContract, getOpsProjectUnits, createProjectUnits, deleteOpsProjectUnits,
} from '../../lib/api'
import { OPS_STATUSES, statusDef } from './OperationsList'
import { useAuth } from '../../contexts/AuthContext'

const DRIVE_TYPES = [
  { value: 'traction', label: 'Traction' },
  { value: 'platform', label: 'Platform' },
  { value: 'hydraulic', label: 'Hydraulic' },
]
const USE_TYPES = [
  { value: 'passenger', label: 'Passenger' },
  { value: 'service', label: 'Service' },
]

const inputStyle = {
  width: '100%', border: '1px solid #D4AF37', backgroundColor: '#FFFFFF',
  color: '#2C2C2C', padding: '8px 12px', fontSize: 14, outline: 'none',
}
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#2C2C2C', marginBottom: 4 }
const sectionTitle = { fontSize: 13, fontWeight: 700, color: '#2C2C2C', marginBottom: 8 }

const EMPTY = {
  project_name: '', pic: '', address: '', specs: '', unit_label: '', s_o_f: '',
  subcon: '', contact_person: '', contact_number: '',
  brand: '', drive_type: '', use_type: '',
  status: 'awaiting_shaft_readiness', concerns: '', stall_reason: '',
  qa_pre_install: false, qa_mid: false, qa_pre_handover: false,
  qa_pre_install_date: '', qa_mid_date: '', qa_pre_handover_date: '',
  maintenance_start_date: '', maintenance_end_date: '', renewal_negotiation_status: 'none',
}

function defaultExtraUnit(n) {
  return { unit_number: n, unit_label: '', specs: '', brand: '', drive_type: '', use_type: 'passenger', s_o_f: '' }
}

function QARow({ label, checked, date, onCheck, onDate }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #E8E0C8' }}>
      <button type="button" onClick={onCheck}
        style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
          backgroundColor: checked ? '#D4AF37' : '#FFFFFF',
          border: '2px solid #D4AF37',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#FFFFFF', fontWeight: 700, fontSize: 14,
        }}>
        {checked ? '✓' : ''}
      </button>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C', minWidth: 160 }}>{label}</span>
      {checked && (
        <input type="date" value={date} onChange={e => onDate(e.target.value)}
          style={{ border: '1px solid #D4AF37', padding: '4px 8px', fontSize: 13, color: '#2C2C2C', outline: 'none' }} />
      )}
      {!checked && <span style={{ fontSize: 12, color: '#CCCCCC' }}>Click circle to mark done</span>}
    </div>
  )
}

function ExtraUnitCard({ unit, index, onChange, onRemove }) {
  function set(field, value) { onChange(index, { ...unit, [field]: value }) }
  return (
    <div style={{ border: '1px solid #D4AF37', padding: 16, marginBottom: 10, backgroundColor: '#FFFFFF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2C' }}>Unit {unit.unit_number}</p>
        <button type="button" onClick={() => onRemove(index)}
          style={{ fontSize: 12, color: '#8B0000', border: '1px solid #8B0000', padding: '3px 8px', background: 'none', cursor: 'pointer' }}>
          Remove
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>Specs / Capacity</label>
          <input value={unit.specs} onChange={e => set('specs', e.target.value)}
            placeholder="e.g. 450 kg" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Unit Label</label>
          <input value={unit.unit_label} onChange={e => set('unit_label', e.target.value)}
            placeholder="e.g. Pe2" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Stops / Openings / Floors</label>
          <input value={unit.s_o_f} onChange={e => set('s_o_f', e.target.value)}
            placeholder="e.g. 4/4/4" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Brand</label>
          <input value={unit.brand} onChange={e => set('brand', e.target.value)}
            placeholder="e.g. Kone, Otis" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Drive type</label>
          <select value={unit.drive_type} onChange={e => set('drive_type', e.target.value)} style={inputStyle}>
            <option value="">Select…</option>
            {DRIVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Use type</label>
          <select value={unit.use_type} onChange={e => set('use_type', e.target.value)} style={inputStyle}>
            {USE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

export default function OperationsForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role, user } = useAuth()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY)
  const [extraUnits, setExtraUnits] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteRequested, setDeleteRequested] = useState(false)

  useEffect(() => {
    if (isEdit) {
      Promise.all([getOpsProject(id), getOpsProjectUnits(id)]).then(([proj, units]) => {
        if (proj.data) {
          const d = proj.data
          setForm({
            project_name: d.project_name || '',
            pic: d.pic || '',
            address: d.address || '',
            specs: d.specs || '',
            unit_label: d.unit_label || '',
            s_o_f: d.s_o_f || '',
            subcon: d.subcon || '',
            contact_person: d.contact_person || '',
            contact_number: d.contact_number || '',
            brand: d.brand || '',
            drive_type: d.drive_type || '',
            use_type: d.use_type || '',
            status: d.status || 'awaiting_shaft_readiness',
            concerns: d.concerns || '',
            stall_reason: d.stall_reason || '',
            maintenance_start_date: d.maintenance_start_date || '',
            maintenance_end_date: d.maintenance_end_date || '',
            renewal_negotiation_status: d.renewal_negotiation_status || 'none',
            qa_pre_install: d.qa_pre_install || false,
            qa_mid: d.qa_mid || false,
            qa_pre_handover: d.qa_pre_handover || false,
            qa_pre_install_date: d.qa_pre_install_date || '',
            qa_mid_date: d.qa_mid_date || '',
            qa_pre_handover_date: d.qa_pre_handover_date || '',
            deletion_pending: d.deletion_pending || false,
          })
        }
        // Load extra units (unit_number >= 2)
        const extra = (units.data || []).filter(u => u.unit_number >= 2).map(u => ({
          unit_number: u.unit_number,
          unit_label: u.unit_label || '',
          specs: u.specs || '',
          brand: u.brand || '',
          drive_type: u.drive_type || '',
          use_type: u.use_type || 'passenger',
          s_o_f: [u.stops, u.openings, u.floors].filter(Boolean).join('/') || '',
        }))
        setExtraUnits(extra)
      })
    }
  }, [id, isEdit])

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }
  function handleChange(e) { set(e.target.name, e.target.value) }

  function addExtraUnit() {
    setExtraUnits(u => [...u, defaultExtraUnit(u.length + 2)])
  }
  function updateExtraUnit(index, updated) {
    setExtraUnits(u => u.map((unit, i) => i === index ? updated : unit))
  }
  function removeExtraUnit(index) {
    setExtraUnits(u => {
      const next = u.filter((_, i) => i !== index)
      return next.map((unit, i) => ({ ...unit, unit_number: i + 2 }))
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const isHandingOver = form.status === 'handed_over'
    const today = new Date().toISOString().split('T')[0]
    const oneYearLater = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]

    const payload = {
      ...form,
      qa_pre_install_date: form.qa_pre_install_date || null,
      qa_mid_date: form.qa_mid_date || null,
      qa_pre_handover_date: form.qa_pre_handover_date || null,
      ...(isHandingOver && !form.handed_over_date ? {
        handed_over_date: today,
        year_completed: new Date().getFullYear(),
        maintenance_start_date: form.maintenance_start_date || today,
        maintenance_end_date: form.maintenance_end_date || oneYearLater,
      } : {}),
    }

    const { data: saved, error: err } = isEdit
      ? await updateOpsProject(id, payload)
      : await createOpsProject(payload)
    setSaving(false)
    if (err) { setError(err.message); return }

    const opsId = isEdit ? id : saved?.id

    // Save extra units (delete old, create new)
    if (opsId && extraUnits.length > 0) {
      await deleteOpsProjectUnits(opsId)
      const unitRecords = extraUnits.map(u => {
        const parts = u.s_o_f ? u.s_o_f.split('/') : []
        return {
          ops_project_id: opsId,
          unit_number: u.unit_number,
          unit_label: u.unit_label || null,
          brand: u.brand || null,
          drive_type: u.drive_type || null,
          use_type: u.use_type || null,
          stops: parts[0] ? parseInt(parts[0]) : null,
          openings: parts[1] ? parseInt(parts[1]) : null,
          floors: parts[2] ? parseInt(parts[2]) : null,
        }
      })
      await createProjectUnits(unitRecords)
    } else if (opsId && extraUnits.length === 0 && isEdit) {
      await deleteOpsProjectUnits(opsId)
    }

    // Auto-create maintenance contract on first handover
    if (isHandingOver && isEdit) {
      await createAmcContract({
        project_name: form.project_name,
        contract_type: 'comprehensive',
        start_date: payload.maintenance_start_date,
        end_date: payload.maintenance_end_date,
        status: 'active',
        coverage_notes: `Auto-created from handover. 1-year free maintenance. Pic: ${form.pic || '—'}`,
        billing_frequency: 'by_call',
        vat_inclusive: true,
      })
    }

    navigate('/operations')
  }

  async function handleDelete() {
    await deleteOpsProject(id)
    navigate('/operations')
  }

  async function handleRequestDeletion() {
    await requestDeletion(id, user?.email || 'staff')
    setDeleteRequested(true)
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <Link to="/operations" style={{ fontSize: 13, color: '#D4AF37', fontWeight: 600 }}>← Project Status</Link>

      <h1 className="text-2xl font-bold mt-3 mb-6" style={{ color: '#2C2C2C' }}>
        {isEdit ? 'Edit Project' : 'New Project'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic info */}
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24 }} className="space-y-4">
          <p style={sectionTitle}>Project info</p>

          <div>
            <label style={labelStyle}>Project name *</label>
            <input name="project_name" value={form.project_name} onChange={handleChange} required
              placeholder="e.g. Sm Aura Tower" style={inputStyle} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Project-in-charge (PIC)</label>
              <input name="pic" value={form.pic} onChange={handleChange}
                placeholder="e.g. Vic, Jonathan, Chel" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Subcon</label>
              <input name="subcon" value={form.subcon} onChange={handleChange}
                placeholder="e.g. Elizardo" style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Contact person</label>
              <input name="contact_person" value={form.contact_person} onChange={handleChange}
                placeholder="e.g. Engr. Bianca" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Contact number</label>
              <input name="contact_number" value={form.contact_number} onChange={handleChange}
                placeholder="e.g. 09212925000" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Address</label>
            <input name="address" value={form.address} onChange={handleChange}
              placeholder="e.g. Quezon Ave., Sta Cruz, Laguna" style={inputStyle} />
          </div>
        </div>

        {/* Unit specs — Unit 1 (main fields) */}
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24 }}>
          <p style={sectionTitle}>Unit specs</p>

          {/* Unit 1 header */}
          <p style={{ fontSize: 12, fontWeight: 700, color: '#888888', marginBottom: 10 }}>
            Unit 1 {extraUnits.length > 0 ? `(of ${extraUnits.length + 1})` : ''}
          </p>

          <div className="grid grid-cols-3 gap-4" style={{ marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Specs / Capacity</label>
              <input name="specs" value={form.specs} onChange={handleChange}
                placeholder="e.g. 450 kg" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Unit label</label>
              <input name="unit_label" value={form.unit_label} onChange={handleChange}
                placeholder="e.g. Pe1" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Stops / Openings / Floors</label>
              <input name="s_o_f" value={form.s_o_f} onChange={handleChange}
                placeholder="e.g. 4/4/4" style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4" style={{ marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Brand</label>
              <input name="brand" value={form.brand} onChange={handleChange}
                placeholder="e.g. Kone, Otis, Schindler" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Drive type</label>
              <select name="drive_type" value={form.drive_type} onChange={handleChange} style={inputStyle}>
                <option value="">Select…</option>
                {DRIVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Use type</label>
              <select name="use_type" value={form.use_type} onChange={handleChange} style={inputStyle}>
                <option value="">Select…</option>
                {USE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Extra units */}
          {extraUnits.map((unit, i) => (
            <ExtraUnitCard key={i} unit={unit} index={i}
              onChange={updateExtraUnit} onRemove={removeExtraUnit} />
          ))}

          <button type="button" onClick={addExtraUnit}
            style={{ width: '100%', padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', backgroundColor: '#FFFFFF', color: '#D4AF37', border: '2px dashed #D4AF37' }}>
            + Add unit {extraUnits.length + 2}
          </button>
        </div>

        {/* Status */}
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24 }}>
          <p style={sectionTitle}>Project status</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
            {OPS_STATUSES.map(s => (
              <button key={s.value} type="button" onClick={() => set('status', s.value)}
                style={{
                  padding: '10px 8px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  backgroundColor: form.status === s.value ? s.bg : '#FFFFFF',
                  color: form.status === s.value ? s.color : '#888888',
                  border: `1px solid ${form.status === s.value ? s.bg : '#D4AF37'}`,
                }}>
                {s.label}
              </button>
            ))}
          </div>

          {(form.status === 'done_tnc' || form.status === 'awaiting_power') && (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Stall reason (if any)</label>
              <input name="stall_reason" value={form.stall_reason} onChange={handleChange}
                placeholder="e.g. Awaiting permanent power supply" style={inputStyle} />
            </div>
          )}

          {form.status === 'handed_over' && (
            <div style={{ backgroundColor: '#2C2C2C', border: '1px solid #D4AF37', padding: 14, marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#D4AF37', marginBottom: 4 }}>Handover notice</p>
              <p style={{ fontSize: 12, color: '#F5F5DC' }}>
                Saving will move this project to Finished Projects and auto-create a 1-year free maintenance contract.
                Make sure the warranty dates below are correct before saving.
              </p>
            </div>
          )}

          <div>
            <label style={labelStyle}>Concerns / Notes</label>
            <textarea name="concerns" value={form.concerns} onChange={handleChange} rows={3}
              placeholder="Any open items, punchlist, or follow-ups…" style={inputStyle} />
          </div>
        </div>

        {/* QA Checkpoints */}
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24 }}>
          <p style={sectionTitle}>QA inspections</p>
          <p style={{ fontSize: 12, color: '#888888', marginBottom: 16 }}>QA must inspect at 3 stages. Click the circle to mark each as done.</p>

          <QARow
            label="Pre-installation check"
            checked={form.qa_pre_install}
            date={form.qa_pre_install_date}
            onCheck={() => set('qa_pre_install', !form.qa_pre_install)}
            onDate={v => set('qa_pre_install_date', v)}
          />
          <QARow
            label="Mid-installation check"
            checked={form.qa_mid}
            date={form.qa_mid_date}
            onCheck={() => set('qa_mid', !form.qa_mid)}
            onDate={v => set('qa_mid_date', v)}
          />
          <QARow
            label="Pre-handover check"
            checked={form.qa_pre_handover}
            date={form.qa_pre_handover_date}
            onCheck={() => set('qa_pre_handover', !form.qa_pre_handover)}
            onDate={v => set('qa_pre_handover_date', v)}
          />
        </div>

        {/* Warranty / Maintenance */}
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24 }}>
          <p style={sectionTitle}>Warranty & maintenance</p>
          <p style={{ fontSize: 12, color: '#888888', marginBottom: 16 }}>Set dates to activate 7-day expiry alert and 10-day renewal follow-up.</p>

          <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Warranty start date</label>
              <input type="date" name="maintenance_start_date" value={form.maintenance_start_date} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Warranty end date</label>
              <input type="date" name="maintenance_end_date" value={form.maintenance_end_date} onChange={handleChange} style={inputStyle} />
              {form.maintenance_end_date && (() => {
                const days = Math.ceil((new Date(form.maintenance_end_date) - Date.now()) / 86400000)
                if (days <= 0) return <p style={{ fontSize: 11, color: '#8B0000', marginTop: 4 }}>Expired {Math.abs(days)} days ago</p>
                if (days <= 7) return <p style={{ fontSize: 11, color: '#8B4500', marginTop: 4 }}>Expires in {days} days</p>
                return <p style={{ fontSize: 11, color: '#888888', marginTop: 4 }}>{days} days remaining</p>
              })()}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Renewal status</label>
            <select name="renewal_negotiation_status" value={form.renewal_negotiation_status} onChange={handleChange} style={inputStyle}>
              <option value="none">None / Not started</option>
              <option value="in_negotiation">In negotiation</option>
              <option value="paid">Paid / Renewed</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>

        {error && <p style={{ color: '#8B0000', fontSize: 13 }}>{error}</p>}

        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '8px 20px', fontWeight: 600, fontSize: 14, opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => navigate('/operations')}
              style={{ backgroundColor: '#FFFFFF', color: '#2C2C2C', padding: '8px 20px', border: '1px solid #D4AF37', fontSize: 14 }}>
              Cancel
            </button>
          </div>
          {isEdit && role === 'admin' && !confirmDelete && (
            <button type="button" onClick={() => setConfirmDelete(true)}
              style={{ fontSize: 12, color: '#8B0000', border: '1px solid #8B0000', padding: '6px 12px', background: 'none', cursor: 'pointer' }}>
              Delete project
            </button>
          )}
          {isEdit && role === 'admin' && confirmDelete && (
            <div className="flex gap-2 items-center">
              <span style={{ fontSize: 12, color: '#8B0000' }}>Sure?</span>
              <button type="button" onClick={handleDelete}
                style={{ fontSize: 12, backgroundColor: '#8B0000', color: '#FFFFFF', padding: '6px 12px', border: 'none', cursor: 'pointer' }}>
                Yes, delete
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)}
                style={{ fontSize: 12, color: '#888888', border: '1px solid #CCCCCC', padding: '6px 12px', background: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          )}
          {isEdit && role !== 'admin' && !deleteRequested && !form.deletion_pending && (
            <button type="button" onClick={handleRequestDeletion}
              style={{ fontSize: 12, color: '#8B0000', border: '1px solid #8B0000', padding: '6px 12px', background: 'none', cursor: 'pointer' }}>
              Request deletion
            </button>
          )}
          {isEdit && role !== 'admin' && (deleteRequested || form.deletion_pending) && (
            <span style={{ fontSize: 12, color: '#888888', fontStyle: 'italic' }}>
              Deletion pending owner approval
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
