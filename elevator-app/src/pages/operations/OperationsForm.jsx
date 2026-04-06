import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { createOpsProject, getOpsProject, updateOpsProject, deleteOpsProject, requestDeletion, createAmcContract } from '../../lib/api'
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

const EMPTY = {
  project_name: '', pic: '', address: '', specs: '', unit_label: '', s_o_f: '',
  subcon: '', contact_person: '', contact_number: '',
  brand: '', drive_type: '', use_type: '',
  status: 'awaiting_shaft_readiness', concerns: '', stall_reason: '',
  qa_pre_install: false, qa_mid: false, qa_pre_handover: false,
  qa_pre_install_date: '', qa_mid_date: '', qa_pre_handover_date: '',
  maintenance_start_date: '', maintenance_end_date: '', renewal_negotiation_status: 'none',
}

function QARow({ label, checked, date, onCheck, onDate }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #E8E0C8' }}>
      <button type="button" onClick={onCheck}
        style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
          backgroundColor: checked ? '#D4AF37' : '#FFFFFF',
          border: `2px solid #D4AF37`,
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

export default function OperationsForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role, user } = useAuth()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteRequested, setDeleteRequested] = useState(false)

  useEffect(() => {
    if (isEdit) {
      getOpsProject(id).then(({ data }) => {
        if (data) setForm({
          project_name: data.project_name || '',
          pic: data.pic || '',
          address: data.address || '',
          specs: data.specs || '',
          unit_label: data.unit_label || '',
          s_o_f: data.s_o_f || '',
          subcon: data.subcon || '',
          contact_person: data.contact_person || '',
          contact_number: data.contact_number || '',
          brand: data.brand || '',
          drive_type: data.drive_type || '',
          use_type: data.use_type || '',
          status: data.status || 'awaiting_shaft_readiness',
          concerns: data.concerns || '',
          stall_reason: data.stall_reason || '',
          maintenance_start_date: data.maintenance_start_date || '',
          maintenance_end_date: data.maintenance_end_date || '',
          renewal_negotiation_status: data.renewal_negotiation_status || 'none',
          qa_pre_install: data.qa_pre_install || false,
          qa_mid: data.qa_mid || false,
          qa_pre_handover: data.qa_pre_handover || false,
          qa_pre_install_date: data.qa_pre_install_date || '',
          qa_mid_date: data.qa_mid_date || '',
          qa_pre_handover_date: data.qa_pre_handover_date || '',
        })
      })
    }
  }, [id, isEdit])

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }
  function handleChange(e) { set(e.target.name, e.target.value) }

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
        // Auto-set warranty start if not already set
        maintenance_start_date: form.maintenance_start_date || today,
        maintenance_end_date: form.maintenance_end_date || oneYearLater,
      } : {}),
    }

    const { data: saved, error: err } = isEdit
      ? await updateOpsProject(id, payload)
      : await createOpsProject(payload)
    setSaving(false)
    if (err) { setError(err.message); return }

    // Auto-create maintenance contract on first handover
    if (isHandingOver && isEdit) {
      await createAmcContract({
        project_name: form.project_name,
        contract_type: 'comprehensive',
        start_date: payload.maintenance_start_date,
        end_date: payload.maintenance_end_date,
        status: 'active',
        coverage_notes: `Auto-created from Project Status handover. 1-year free maintenance. PIC: ${form.pic || '—'}`,
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

  const curStatus = statusDef(form.status)

  return (
    <div style={{ maxWidth: 640 }}>
      <Link to="/operations" style={{ fontSize: 13, color: '#D4AF37', fontWeight: 600 }}>← Project Status</Link>

      <h1 className="text-2xl font-bold mt-3 mb-6" style={{ color: '#2C2C2C' }}>
        {isEdit ? 'Edit Project' : 'New Project'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic info */}
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24 }} className="space-y-4">
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Project Info</p>

          <div>
            <label style={labelStyle}>Project Name *</label>
            <input name="project_name" value={form.project_name} onChange={handleChange} required
              placeholder="e.g. SM Aura Tower" style={inputStyle} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Project-in-Charge (PIC)</label>
              <input name="pic" value={form.pic} onChange={handleChange}
                placeholder="e.g. VIC, Jonathan, CHEL" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Subcon</label>
              <input name="subcon" value={form.subcon} onChange={handleChange}
                placeholder="e.g. ELIZARDO" style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Contact Person</label>
              <input name="contact_person" value={form.contact_person} onChange={handleChange}
                placeholder="e.g. Engr. Bianca" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Contact Number</label>
              <input name="contact_number" value={form.contact_number} onChange={handleChange}
                placeholder="e.g. 09212925000" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Address</label>
            <input name="address" value={form.address} onChange={handleChange}
              placeholder="e.g. Quezon Ave., Sta Cruz, Laguna" style={inputStyle} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label style={labelStyle}>Specs / Capacity</label>
              <input name="specs" value={form.specs} onChange={handleChange}
                placeholder="e.g. 450 KG" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Unit Label</label>
              <input name="unit_label" value={form.unit_label} onChange={handleChange}
                placeholder="e.g. PE1, CL1" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Stops / Openings / Floors</label>
              <input name="s_o_f" value={form.s_o_f} onChange={handleChange}
                placeholder="e.g. 4/4/4" style={inputStyle} />
            </div>
          </div>

          {/* Elevator Type Details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label style={labelStyle}>Brand</label>
              <input name="brand" value={form.brand} onChange={handleChange}
                placeholder="e.g. KONE, Otis, Schindler" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Drive Type</label>
              <select name="drive_type" value={form.drive_type} onChange={handleChange} style={inputStyle}>
                <option value="">Select…</option>
                {DRIVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Use Type</label>
              <select name="use_type" value={form.use_type} onChange={handleChange} style={inputStyle}>
                <option value="">Select…</option>
                {USE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Project Status</p>

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
              <label style={labelStyle}>Stall Reason (if any)</label>
              <input name="stall_reason" value={form.stall_reason} onChange={handleChange}
                placeholder="e.g. Awaiting permanent power supply" style={inputStyle} />
            </div>
          )}

          {form.status === 'handed_over' && (
            <div style={{ backgroundColor: '#2C2C2C', border: '1px solid #D4AF37', padding: 14, marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#D4AF37', marginBottom: 4 }}>Handover Notice</p>
              <p style={{ fontSize: 12, color: '#F5F5DC' }}>
                Saving will move this project to Finished Projects and auto-create a 1-year free maintenance contract.
                Make sure the Warranty dates below are correct before saving.
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
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>QA Inspections</p>
          <p style={{ fontSize: 12, color: '#888888', marginBottom: 16 }}>QA must inspect at 3 stages. Click the circle to mark each as done.</p>

          <QARow
            label="Pre-Installation Check"
            checked={form.qa_pre_install}
            date={form.qa_pre_install_date}
            onCheck={() => set('qa_pre_install', !form.qa_pre_install)}
            onDate={v => set('qa_pre_install_date', v)}
          />
          <QARow
            label="Mid-Installation Check"
            checked={form.qa_mid}
            date={form.qa_mid_date}
            onCheck={() => set('qa_mid', !form.qa_mid)}
            onDate={v => set('qa_mid_date', v)}
          />
          <QARow
            label="Pre-Handover Check"
            checked={form.qa_pre_handover}
            date={form.qa_pre_handover_date}
            onCheck={() => set('qa_pre_handover', !form.qa_pre_handover)}
            onDate={v => set('qa_pre_handover_date', v)}
          />
        </div>

        {/* Warranty / Maintenance */}
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Warranty & Maintenance</p>
          <p style={{ fontSize: 12, color: '#888888', marginBottom: 16 }}>Set dates to activate 7-day expiry alert and 10-day renewal follow-up.</p>

          <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Warranty Start Date</label>
              <input type="date" name="maintenance_start_date" value={form.maintenance_start_date} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Warranty End Date</label>
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
            <label style={labelStyle}>Renewal Status</label>
            <select name="renewal_negotiation_status" value={form.renewal_negotiation_status} onChange={handleChange} style={inputStyle}>
              <option value="none">None / Not started</option>
              <option value="in_negotiation">In Negotiation</option>
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
          {/* Admin: direct delete with confirm */}
          {isEdit && role === 'admin' && !confirmDelete && (
            <button type="button" onClick={() => setConfirmDelete(true)}
              style={{ fontSize: 12, color: '#8B0000', border: '1px solid #8B0000', padding: '6px 12px', background: 'none', cursor: 'pointer' }}>
              Delete Project
            </button>
          )}
          {isEdit && role === 'admin' && confirmDelete && (
            <div className="flex gap-2 items-center">
              <span style={{ fontSize: 12, color: '#8B0000' }}>Sure?</span>
              <button type="button" onClick={handleDelete}
                style={{ fontSize: 12, backgroundColor: '#8B0000', color: '#FFFFFF', padding: '6px 12px', border: 'none', cursor: 'pointer' }}>
                Yes, Delete
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)}
                style={{ fontSize: 12, color: '#888888', border: '1px solid #CCCCCC', padding: '6px 12px', background: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          )}
          {/* Non-admin: request deletion (needs owner approval) */}
          {isEdit && role !== 'admin' && !deleteRequested && !form.deletion_pending && (
            <button type="button" onClick={handleRequestDeletion}
              style={{ fontSize: 12, color: '#8B0000', border: '1px solid #8B0000', padding: '6px 12px', background: 'none', cursor: 'pointer' }}>
              Request Deletion
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
